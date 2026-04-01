import { useGarden } from '@/contexts/GardenContext';
import { CoinBalance } from '@/components/CoinBalance';
import { ChevronDown, Clock, AlertCircle, ArrowLeft, X, Megaphone, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PAYMENT_LEVELS, getPaymentLevel, getNextPaymentLevel, MIN_WITHDRAW } from '@/lib/gameConfig';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/hooks/useTelegram';

import paymentWalletImg from '@/assets/payment-wallet.png';

function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

function getUzbekistanNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5 * 3600000);
}

function formatUzDate(date: Date): string {
  const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getExpectedDate(processingDays: number): string {
  return formatUzDate(addBusinessDays(getUzbekistanNow(), processingDays));
}

type WithdrawStep = 'phone' | 'card' | 'amount' | 'confirm' | 'done';

const STATUS_CONFIG = {
  pending: { bg: 'hsl(45 90% 55%)', text: 'hsl(45 90% 20%)', label: "So'rov yuborildi" },
  approved: { bg: 'hsl(200 70% 50%)', text: 'hsl(0 0% 100%)', label: "Tasdiqlandi • O'tkazilmoqda" },
  paid: { bg: 'hsl(145 50% 45%)', text: 'hsl(0 0% 100%)', label: "To'landi ✓" },
  rejected: { bg: 'hsl(0 70% 50%)', text: 'hsl(0 0% 100%)', label: 'Rad etildi' },
} as const;

interface PaymentRecord {
  id: string;
  username: string;
  first_name: string;
  photo_url?: string;
  amount: number;
  amount_uzs: number;
  card_last4: string;
  payment_level_name: string;
  status: keyof typeof STATUS_CONFIG;
  created_at: string;
  paid_date?: string;
}

const COIN_TO_UZS = 5000 / 9000; // 9000 tanga = 5000 UZS

export default function Payments() {
  const { userData } = useGarden();
  const telegram = useTelegram();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>('phone');
  const [phone, setPhone] = useState('');
  const [phoneLoaded, setPhoneLoaded] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showChannel, setShowChannel] = useState(false);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [channelPayments, setChannelPayments] = useState<PaymentRecord[]>([]);
  const [myRequests, setMyRequests] = useState<PaymentRecord[]>([]);
  const [totalPaidUzs, setTotalPaidUzs] = useState(0);

  const treesGrown = userData.stats.totalTreesGrown;
  const referralCount = userData.referral.referredUsers.length;
  const userLevel = getPaymentLevel(treesGrown, referralCount);
  const nextLevel = getNextPaymentLevel(userLevel);

  // Load paid payments for channel (last 30) and auto-fill phone
  useEffect(() => {
    loadChannelPayments();
    loadMyRequests();
    // Auto-fill phone from DB
    if (!phoneLoaded && telegram.id) {
      supabase
        .from('users')
        .select('phone')
        .eq('telegram_id', telegram.id)
        .single()
        .then(({ data }) => {
          if (data?.phone) {
            setPhone(data.phone as string);
          }
          setPhoneLoaded(true);
        });
    }
  }, [telegram.id]);

  const loadChannelPayments = async () => {
    const { data } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('status', 'paid')
      .order('paid_date', { ascending: false })
      .limit(30);
    if (data) {
      setChannelPayments(data as unknown as PaymentRecord[]);
      const total = data.reduce((sum: number, p: any) => sum + (p.amount_uzs || 0), 0);
      setTotalPaidUzs(total);
    }
  };

  const loadMyRequests = async () => {
    if (!telegram.id) return;
    const { data } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('user_telegram_id', telegram.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setMyRequests(data as unknown as PaymentRecord[]);
  };

  const handleCardInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(\d{4})/g, '$1 ').trim());
  };

  const rawCard = cardNumber.replace(/\s/g, '');
  const expectedDate = getExpectedDate(userLevel.processingDays);
  const requestDateStr = formatUzDate(getUzbekistanNow());

  const handleStartWithdraw = () => {
    setWithdrawStep('phone');
    setPhone('');
    setCardNumber('');
    setWithdrawAmount('');
    setShowWithdraw(true);
  };

  const handleSubmitWithdraw = async () => {
    const amount = Number(withdrawAmount);
    const amountUzs = Math.floor(amount * COIN_TO_UZS);
    const photoUrl = (window.Telegram?.WebApp?.initDataUnsafe as any)?.user?.photo_url || null;

    await supabase.from('payment_requests').insert({
      user_telegram_id: telegram.id,
      username: telegram.username,
      first_name: telegram.firstName,
      photo_url: photoUrl,
      amount,
      amount_uzs: amountUzs,
      phone,
      card_number: rawCard,
      card_last4: rawCard.slice(-4),
      payment_level_id: userLevel.id,
      payment_level_name: userLevel.name,
      expected_date: expectedDate,
    } as any);

    setWithdrawStep('done');
    loadMyRequests();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}-${['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'][d.getMonth()]}`;
  };

  // --- Channel Modal ---
  const ChannelModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'hsl(0 0% 0% / 0.5)' }}>
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden" style={{ boxShadow: '0 25px 50px hsl(0 0% 0% / 0.25)' }}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-card-foreground">📢 To'lovlar kanali</h3>
          <button onClick={() => setShowChannel(false)} className="p-1.5 rounded-full hover:bg-muted">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Umumiy to'langan summa</p>
          <p className="text-lg font-bold" style={{ color: 'hsl(145 50% 40%)' }}>{totalPaidUzs.toLocaleString()} UZS</p>
          <p className="text-xs text-muted-foreground mt-1">Oxirgi 30 ta to'lov</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
          {channelPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Hozircha to'lovlar yo'q</p>
          ) : (
            channelPayments.map((p) => (
              <div key={p.id} className="rounded-xl p-3 border border-border bg-background">
                <div className="flex items-center gap-2.5 mb-2">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" width={32} height={32} />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'hsl(0 75% 50% / 0.1)' }}>🧑‍🌾</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-card-foreground truncate">
                      {p.username ? `@${p.username}` : p.first_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{p.payment_level_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color: 'hsl(0 75% 50%)' }}>{p.amount.toLocaleString()} tanga</span>
                    <p className="text-[10px]" style={{ color: 'hsl(145 50% 40%)' }}>{p.amount_uzs?.toLocaleString()} UZS</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-muted-foreground">
                    So'rov: {formatDate(p.created_at)} {p.paid_date && `• To'landi: ${formatDate(p.paid_date)}`}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: STATUS_CONFIG[p.status].bg, color: STATUS_CONFIG[p.status].text }}>
                    {STATUS_CONFIG[p.status].label}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // --- My Requests Modal ---
  const MyRequestsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'hsl(0 0% 0% / 0.5)' }}>
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden" style={{ boxShadow: '0 25px 50px hsl(0 0% 0% / 0.25)' }}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-card-foreground">📋 Mening so'rovlarim</h3>
          <button onClick={() => setShowMyRequests(false)} className="p-1.5 rounded-full hover:bg-muted">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
          {myRequests.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-muted-foreground">Hozircha so'rovlar yo'q</p>
              <p className="text-xs text-muted-foreground mt-1">Pul yechish so'rovi yuborganingizda bu yerda ko'rinadi</p>
            </div>
          ) : (
            myRequests.map((r) => (
              <div key={r.id} className="rounded-xl p-3 border border-border bg-background">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-bold text-card-foreground">{r.amount.toLocaleString()} tanga</span>
                    <span className="text-xs text-muted-foreground ml-2">({r.amount_uzs?.toLocaleString()} UZS)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: STATUS_CONFIG[r.status].bg, color: STATUS_CONFIG[r.status].text }}>
                    {STATUS_CONFIG[r.status].label}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  <p>So'rov sanasi: {formatDate(r.created_at)}</p>
                  <p>Daraja: {r.payment_level_name} • {userLevel.processingDays} ish kuni</p>
                  {r.status === 'pending' && (
                    <p style={{ color: 'hsl(38 80% 45%)' }}>⏳ Darajangizni oshirsangiz tezroq to'lov olasiz!</p>
                  )}
                  {r.paid_date && <p style={{ color: 'hsl(145 50% 35%)' }}>✅ To'landi: {formatDate(r.paid_date)}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Withdraw flow
  if (showWithdraw) {
    return (
      <div className="px-4 py-3 pb-28" style={{ background: 'linear-gradient(180deg, hsl(20 30% 96%) 0%, hsl(15 20% 93%) 100%)', minHeight: '100vh' }}>
        <button onClick={() => setShowWithdraw(false)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </button>
        <h2 className="text-lg font-bold text-foreground mb-4">💰 Pul yechish</h2>

        {withdrawStep === 'phone' && (
          <div className="card-flat p-5">
            <h3 className="font-bold text-card-foreground text-sm mb-3">📱 Telefon raqamingiz</h3>
            <p className="text-xs text-muted-foreground mb-3">🔒 Xavfsizlik uchun telefon raqamingizni kiriting</p>
            <input
              type="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => setWithdrawStep('card')}
              disabled={phone.length < 9}
              className="btn-cartoon w-full py-3 mt-4 disabled:opacity-50"
            >
              Davom etish →
            </button>
          </div>
        )}

        {withdrawStep === 'card' && (
          <div className="card-flat p-5">
            <h3 className="font-bold text-card-foreground text-sm mb-3">💳 Karta raqamini kiriting</h3>
            <p className="text-xs text-muted-foreground mb-3">Uzcard yoki Humo kartangizga pul yechib olishingiz mumkin</p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="8600 1234 5678 9012"
              value={cardNumber}
              onChange={(e) => handleCardInput(e.target.value)}
              maxLength={19}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[11px] text-muted-foreground mt-2">Uzcard yoki Humo karta raqamingizni kiriting (16 ta raqam)</p>
            <button
              onClick={() => setWithdrawStep('amount')}
              disabled={rawCard.length !== 16}
              className="btn-cartoon w-full py-3 mt-4 disabled:opacity-50"
            >
              Davom etish →
            </button>
          </div>
        )}

        {withdrawStep === 'amount' && (
          <div className="card-flat p-5">
            <h3 className="font-bold text-card-foreground text-sm mb-3">🪙 Tanga miqdorini kiriting</h3>
            <p className="text-xs text-muted-foreground mb-1">Balansingiz: <span className="font-bold" style={{ color: 'hsl(0 75% 50%)' }}>{userData.coins}</span> tanga</p>
            <p className="text-xs text-muted-foreground mb-1">Haftalik limit: <span className="font-bold">{userLevel.weeklyLimit.toLocaleString()}</span> tanga</p>
            <p className="text-xs mb-1" style={{ color: 'hsl(38 80% 45%)' }}>Minimal yechish: {MIN_WITHDRAW.toLocaleString()} tanga = {Math.floor(MIN_WITHDRAW * COIN_TO_UZS).toLocaleString()} UZS</p>
            {Number(withdrawAmount) >= MIN_WITHDRAW && (
              <p className="text-xs font-bold mb-2" style={{ color: 'hsl(145 50% 40%)' }}>
                ≈ {Math.floor(Number(withdrawAmount) * COIN_TO_UZS).toLocaleString()} UZS
              </p>
            )}
            <input
              type="number"
              inputMode="numeric"
              placeholder={`Minimal ${MIN_WITHDRAW.toLocaleString()}`}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {Number(withdrawAmount) > 0 && Number(withdrawAmount) < MIN_WITHDRAW && (
              <p className="text-[11px] mt-2 flex items-center gap-1" style={{ color: 'hsl(0 75% 50%)' }}>
                <AlertCircle className="w-3 h-3" /> Minimal {MIN_WITHDRAW.toLocaleString()} tanga
              </p>
            )}
            {Number(withdrawAmount) > userLevel.weeklyLimit && (
              <p className="text-[11px] mt-2 flex items-center gap-1" style={{ color: 'hsl(0 75% 50%)' }}>
                <AlertCircle className="w-3 h-3" /> Haftalik limit: {userLevel.weeklyLimit.toLocaleString()} tanga
              </p>
            )}
            <button
              onClick={() => setWithdrawStep('confirm')}
              disabled={Number(withdrawAmount) < MIN_WITHDRAW || Number(withdrawAmount) > userData.coins || Number(withdrawAmount) > userLevel.weeklyLimit}
              className="btn-cartoon w-full py-3 mt-4 disabled:opacity-50"
            >
              Tasdiqlash →
            </button>
          </div>
        )}

        {withdrawStep === 'confirm' && (
          <div className="card-flat p-5">
            <h3 className="font-bold text-card-foreground text-sm mb-4">✅ So'rovni tasdiqlang</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-muted-foreground">Telefon</span>
                <span className="font-bold text-foreground">{phone}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-muted-foreground">Karta</span>
                <span className="font-bold text-foreground font-mono">{cardNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-muted-foreground">Miqdor</span>
                <span className="font-bold" style={{ color: 'hsl(0 75% 50%)' }}>{Number(withdrawAmount).toLocaleString()} tanga</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-muted-foreground">UZS</span>
                <span className="font-bold" style={{ color: 'hsl(145 50% 40%)' }}>{Math.floor(Number(withdrawAmount) * COIN_TO_UZS).toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-muted-foreground">So'rov sanasi</span>
                <span className="font-bold text-foreground text-xs">{requestDateStr}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-xl" style={{ background: 'hsl(145 40% 95%)' }}>
                <span className="text-muted-foreground">Pul tushish sanasi</span>
                <span className="font-bold text-xs" style={{ color: 'hsl(145 50% 35%)' }}>{expectedDate}</span>
              </div>
            </div>
            <button onClick={handleSubmitWithdraw} className="btn-cartoon w-full py-3 mt-4">
              ✅ Tasdiqlash
            </button>
          </div>
        )}

        {withdrawStep === 'done' && (
          <div className="card-flat p-5 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="font-bold text-card-foreground text-base mb-2">So'rov yuborildi!</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {Number(withdrawAmount).toLocaleString()} tanga ({Math.floor(Number(withdrawAmount) * COIN_TO_UZS).toLocaleString()} UZS) yechish so'rovi qabul qilindi.
            </p>
            <div className="rounded-xl p-3 mb-4" style={{ background: 'hsl(145 40% 95%)' }}>
              <p className="text-xs text-muted-foreground">Pulingiz shu sanaga qadar hisobingizga o'tkaziladi:</p>
              <p className="font-bold mt-1" style={{ color: 'hsl(145 50% 35%)' }}>{expectedDate}</p>
            </div>
            <button onClick={() => setShowWithdraw(false)} className="btn-cartoon w-full py-3">
              Tushunarli ✓
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 pb-28 overflow-auto" style={{ background: 'linear-gradient(180deg, hsl(20 30% 96%) 0%, hsl(15 20% 93%) 100%)', minHeight: '100vh' }}>
      {showChannel && <ChannelModal />}
      {showMyRequests && <MyRequestsModal />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src={paymentWalletImg} alt="" className="w-10 h-10" width={40} height={40} />
          <h1 className="text-xl font-bold text-foreground">To'lovlar</h1>
        </div>
        <CoinBalance />
      </div>

      {/* Balance & Withdraw */}
      <div className="card-flat p-5 mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <img src={paymentWalletImg} alt="" className="w-full h-full" width={128} height={128} />
        </div>
        <div className="relative z-10">
          <p className="text-xs text-muted-foreground mb-1">Balans</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: 'hsl(0 75% 50%)' }}>
            {userData.coins} <span className="text-base font-medium text-muted-foreground">tanga</span>
          </p>
          <button onClick={handleStartWithdraw} className="btn-cartoon w-full py-3.5 mt-4 flex items-center justify-center gap-2">
            💰 Pul yechish
          </button>
        </div>
      </div>

      {/* Current Level Card */}
      <div className="card-flat p-4 mb-4 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <img src={userLevel.image} alt={userLevel.name} className="w-14 h-14 object-contain" width={56} height={56} />
          <div className="flex-1">
            <h3 className="font-bold text-card-foreground">
              Daraja {userLevel.id}: {userLevel.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {userLevel.processingDays} ish kuni • Limit: {userLevel.weeklyLimit.toLocaleString()}/hafta
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">O'stirilgan daraxtlar:</span>
            <span className="font-bold text-card-foreground">{treesGrown} ta</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Referallar:</span>
            <span className="font-bold text-card-foreground">{referralCount} ta</span>
          </div>
        </div>

        {nextLevel && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Keyingi: {nextLevel.name}</span>
              <span className="font-bold" style={{ color: 'hsl(0 75% 50%)' }}>
                {treesGrown}/{nextLevel.minTrees} daraxt • {referralCount}/{nextLevel.minReferrals} ref
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    ((Math.min(treesGrown / (nextLevel.minTrees || 1), 1) + Math.min(referralCount / (nextLevel.minReferrals || 1), 1)) / 2) * 100,
                    100
                  )}%`,
                  background: `linear-gradient(90deg, ${userLevel.color}, ${nextLevel.color})`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Two action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => { setShowChannel(true); loadChannelPayments(); }}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white transition-all active:translate-y-[2px] active:shadow-none"
          style={{
            background: 'linear-gradient(180deg, hsl(0 75% 55%) 0%, hsl(0 75% 45%) 100%)',
            boxShadow: '0 4px 0 hsl(0 75% 35%), 0 6px 12px hsl(0 0% 0% / 0.15)',
          }}
        >
          <Megaphone className="w-4 h-4" />
          To'lovlar kanali
        </button>
        <button
          onClick={() => { setShowMyRequests(true); loadMyRequests(); }}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white transition-all active:translate-y-[2px] active:shadow-none"
          style={{
            background: 'linear-gradient(180deg, hsl(0 75% 55%) 0%, hsl(0 75% 45%) 100%)',
            boxShadow: '0 4px 0 hsl(0 75% 35%), 0 6px 12px hsl(0 0% 0% / 0.15)',
          }}
        >
          <FileText className="w-4 h-4" />
          Mening so'rovlarim
        </button>
      </div>
      <p className="text-[11px] text-center text-muted-foreground mb-4">🔓 Barcha to'lovlar ochiq va ishonchli</p>

      {/* All 7 Levels */}
      <h3 className="font-bold text-foreground text-sm mb-3 px-1">📊 Barcha darajalar</h3>
      <div className="space-y-2 mb-6">
        {PAYMENT_LEVELS.map((level) => {
          const isActive = level.id === userLevel.id;
          const isLocked = treesGrown < level.minTrees || referralCount < level.minReferrals;

          return (
            <div
              key={level.id}
              className={`card-flat overflow-hidden transition-all duration-300 ${isActive ? 'ring-2' : ''}`}
              style={isActive ? { borderColor: `${level.color}60`, boxShadow: `0 0 0 2px ${level.color}30` } : {}}
            >
              <button
                onClick={() => setExpandedLevel(expandedLevel === level.id ? null : level.id)}
                className="w-full p-3.5 flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: isLocked ? 'hsl(0 0% 95%)' : `${level.color}10` }}
                >
                  <img src={level.image} alt={level.name} className="w-9 h-9 object-contain"
                    style={isLocked && !isActive ? { filter: 'grayscale(100%) opacity(0.4)' } : {}}
                    width={36} height={36} loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isLocked && !isActive ? 'text-muted-foreground' : 'text-card-foreground'}`}>
                      {level.name}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${level.color}20`, color: level.color }}
                      >Hozirgi</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {level.minTrees > 0 ? `${level.minTrees} daraxt + ${level.minReferrals} ref` : "Boshlang'ich"} • {level.processingDays} kun
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold" style={{ color: isLocked ? 'hsl(0 0% 70%)' : level.color }}>
                    {level.processingDays} kun
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedLevel === level.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: expandedLevel === level.id ? '250px' : '0px' }}>
                <div className="px-3.5 pb-3.5 pt-0">
                  <div className="rounded-xl p-3 space-y-2" style={{ background: isLocked ? 'hsl(0 0% 96%)' : `${level.color}08` }}>
                    <p className="text-xs text-muted-foreground">{level.description}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Kerakli daraxtlar:</span>
                      <span className="font-bold" style={{ color: isLocked ? 'hsl(0 0% 55%)' : level.color }}>{level.minTrees}+</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Kerakli referallar:</span>
                      <span className="font-bold" style={{ color: isLocked ? 'hsl(0 0% 55%)' : level.color }}>{level.minReferrals}+</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Haftalik limit:</span>
                      <span className="font-bold" style={{ color: isLocked ? 'hsl(0 0% 55%)' : level.color }}>{level.weeklyLimit.toLocaleString()} tanga</span>
                    </div>
                    {isLocked && !isActive && (
                      <p className="text-[11px] font-medium mt-1" style={{ color: 'hsl(0 75% 50%)' }}>
                        🔒 {level.minTrees - treesGrown > 0 ? `${level.minTrees - treesGrown} daraxt` : ''}{level.minTrees - treesGrown > 0 && level.minReferrals - referralCount > 0 ? ' va ' : ''}{level.minReferrals - referralCount > 0 ? `${level.minReferrals - referralCount} referal` : ''} kerak
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="card-flat p-4">
        <h3 className="font-bold text-card-foreground text-sm mb-2">💡 Qanday ishlaydi?</h3>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>• Minimal {MIN_WITHDRAW.toLocaleString()} tanga = {Math.floor(MIN_WITHDRAW * COIN_TO_UZS).toLocaleString()} UZS</p>
          <p>• Daraja daraxt va referal soniga qarab oshadi</p>
          <p>• Yuqori daraja = tez to'lov va katta haftalik limit</p>
          <p>• So'rovlar faqat ish kunlarida (Du-Ju) ko'rib chiqiladi</p>
        </div>
      </div>
    </div>
  );
}
