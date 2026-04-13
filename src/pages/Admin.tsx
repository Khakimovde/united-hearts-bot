import { useTelegram } from '@/hooks/useTelegram';
import { ADMIN_TELEGRAM_ID, TREE_CONFIGS, PAYMENT_LEVELS, REFERRAL_LEVELS } from '@/lib/gameConfig';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Shield, Users, TreeDeciduous, Coins, BarChart3, Eye, Search,
  ChevronLeft, CheckCircle2, XCircle, UserCheck, TrendingUp,
  ArrowUpCircle, ArrowDownCircle, Gift, Ban, DollarSign,
  Plus, Trash2, ToggleLeft, ToggleRight, Megaphone
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  todayNewUsers: number;
  totalAdsWatched: number;
  todayAdsWatched: number;
  totalTrees: number;
  totalFruits: { apple: number; pear: number; grape: number; fig: number };
  totalPaidAmount: number;
  totalPaidAmountUzs: number;
  pendingRequests: number;
}

interface DbUserRow {
  telegram_id: string;
  username: string;
  first_name: string;
  coins: number;
  total_trees_grown: number;
  total_ads_watched: number;
  fruits_apple: number;
  fruits_pear: number;
  fruits_grape: number;
  fruits_fig: number;
  referral_code: string;
  referral_earnings: number;
  has_claimed_free_sapling: boolean;
  created_at: string;
  tickets_yellow: number;
  tickets_green: number;
  tickets_red: number;
}

interface PaymentRequest {
  id: string;
  user_telegram_id: string;
  username: string;
  first_name: string;
  photo_url: string | null;
  amount: number;
  amount_uzs: number;
  phone: string;
  card_number: string;
  card_last4: string;
  payment_level_id: number;
  payment_level_name: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  rejection_reason: string | null;
  expected_date: string | null;
  paid_date: string | null;
  created_at: string;
}

interface DbChannelTask {
  id: string;
  channel_id: string;
  channel_name: string;
  reward: number;
  is_active: boolean;
  created_at: string;
}

type AdminTab = 'stats' | 'users' | 'withdrawals' | 'channels';

export default function Admin() {
  const telegram = useTelegram();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');

  useEffect(() => {
    if (telegram.id !== ADMIN_TELEGRAM_ID) {
      navigate('/');
    }
  }, [telegram.id, navigate]);

  if (telegram.id !== ADMIN_TELEGRAM_ID) return null;

  return (
    <div className="px-4 py-3 pb-28" style={{ minHeight: '100vh' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Admin panel</h1>
          <p className="text-xs text-muted-foreground">ID: {telegram.id}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-5 p-1 rounded-2xl bg-muted overflow-x-auto">
        {[
          { key: 'stats' as AdminTab, label: 'Statistika' },
          { key: 'users' as AdminTab, label: 'Foydalanuvchilar' },
          { key: 'withdrawals' as AdminTab, label: "So'rovlar" },
          { key: 'channels' as AdminTab, label: 'Kanallar' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === key ? 'bg-card text-card-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && <StatsSection />}
      {activeTab === 'users' && <UsersSection />}
      {activeTab === 'withdrawals' && <WithdrawalsSection />}
      {activeTab === 'channels' && <ChannelsSection />}
    </div>
  );
}

function StatsSection() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data } = await supabase.rpc('get_admin_stats');
    if (data) setStats(data as unknown as AdminStats);
  };

  if (!stats) return <p className="text-sm text-muted-foreground text-center py-8">Yuklanmoqda...</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Jami foydalanuvchilar" value={stats.totalUsers.toLocaleString()} sub={`Bugun: +${stats.todayNewUsers}`} color="hsl(200 60% 50%)" />
        <StatCard icon={Eye} label="Jami reklamalar" value={stats.totalAdsWatched.toLocaleString()} sub={`Bugun: ${stats.todayAdsWatched.toLocaleString()}`} color="hsl(280 60% 55%)" />
        <StatCard icon={TreeDeciduous} label="Jami daraxtlar" value={stats.totalTrees.toLocaleString()} color="hsl(145 40% 45%)" />
        <StatCard icon={Coins} label="Jami mevalar" value={Object.values(stats.totalFruits).reduce((a, b) => a + b, 0).toLocaleString()} color="hsl(38 80% 52%)" />
        <StatCard icon={DollarSign} label="To'langan (tanga)" value={stats.totalPaidAmount.toLocaleString()} color="hsl(145 50% 45%)" />
        <StatCard icon={DollarSign} label="To'langan (UZS)" value={`${stats.totalPaidAmountUzs.toLocaleString()}`} sub={`Kutilmoqda: ${stats.pendingRequests}`} color="hsl(38 80% 52%)" />
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="text-sm font-bold text-card-foreground mb-3">Mevalar tafsiloti</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(stats.totalFruits).map(([type, count]) => {
            const cfg = TREE_CONFIGS[type as keyof typeof TREE_CONFIGS];
            return (
              <div key={type} className="flex items-center gap-2 p-2 rounded-xl bg-muted/50">
                <span className="text-lg">{cfg.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-card-foreground">{(count as number).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{cfg.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-xl font-bold text-card-foreground tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[10px] font-medium mt-1" style={{ color }}>{sub}</p>}
    </div>
  );
}

function UsersSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<DbUserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<DbUserRow | null>(null);
  const [coinAdjust, setCoinAdjust] = useState('');
  const [fruitType, setFruitType] = useState<'apple' | 'pear' | 'grape' | 'fig'>('apple');
  const [fruitAmount, setFruitAmount] = useState('');
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setUsers(data as unknown as DbUserRow[]);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) { loadUsers(); return; }
    const { data } = await supabase
      .from('users')
      .select('*')
      .or(`telegram_id.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%`)
      .limit(50);
    if (data) setUsers(data as unknown as DbUserRow[]);
  };

  useEffect(() => {
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadReferralCount = async (telegramId: string) => {
    const { count } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_telegram_id', telegramId);
    setReferralCount(count || 0);
  };

  const adjustCoins = async (amount: number) => {
    if (!selectedUser) return;
    const newCoins = Math.max(0, selectedUser.coins + amount);
    await supabase.from('users').update({ coins: newCoins } as any).eq('telegram_id', selectedUser.telegram_id);
    setSelectedUser({ ...selectedUser, coins: newCoins });
    setUsers(prev => prev.map(u => u.telegram_id === selectedUser.telegram_id ? { ...u, coins: newCoins } : u));
    setCoinAdjust('');
  };

  const addTreeGrown = async () => {
    if (!selectedUser) return;
    const newCount = selectedUser.total_trees_grown + 1;
    await supabase.from('users').update({ total_trees_grown: newCount } as any).eq('telegram_id', selectedUser.telegram_id);
    setSelectedUser({ ...selectedUser, total_trees_grown: newCount });
    setUsers(prev => prev.map(u => u.telegram_id === selectedUser.telegram_id ? { ...u, total_trees_grown: newCount } : u));
  };

  if (selectedUser) {
    const paymentLevel = PAYMENT_LEVELS.find(l => selectedUser.total_trees_grown >= l.minTrees && referralCount >= l.minReferrals) || PAYMENT_LEVELS[0];
    const referralLevel = REFERRAL_LEVELS.find(l => referralCount >= l.minReferrals) || REFERRAL_LEVELS[0];

    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <ChevronLeft className="w-4 h-4" /> Orqaga
        </button>

        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: 'hsl(0 75% 50% / 0.1)' }}>
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-bold text-card-foreground">{selectedUser.first_name}</p>
              <p className="text-xs text-muted-foreground">@{selectedUser.username} | ID: {selectedUser.telegram_id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-muted/50">
              <p className="text-muted-foreground">Tangalar</p>
              <p className="font-bold text-card-foreground">{selectedUser.coins.toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-xl bg-muted/50">
              <p className="text-muted-foreground">Daraxtlar</p>
              <p className="font-bold text-card-foreground">{selectedUser.total_trees_grown}</p>
            </div>
            <div className="p-2 rounded-xl bg-muted/50">
              <p className="text-muted-foreground">Reklamalar</p>
              <p className="font-bold text-card-foreground">{selectedUser.total_ads_watched}</p>
            </div>
            <div className="p-2 rounded-xl bg-muted/50">
              <p className="text-muted-foreground">Referallar</p>
              <p className="font-bold text-card-foreground">{referralCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4">
          <h4 className="text-sm font-bold text-card-foreground mb-2">Mevalar</h4>
          <div className="grid grid-cols-4 gap-2">
            {(['apple', 'pear', 'grape', 'fig'] as const).map(type => {
              const cfg = TREE_CONFIGS[type];
              const count = selectedUser[`fruits_${type}` as keyof DbUserRow] as number;
              return (
                <div key={type} className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg">{cfg.emoji}</p>
                  <p className="text-xs font-bold text-card-foreground">{count}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4">
          <h4 className="text-sm font-bold text-card-foreground mb-3">Darajalar</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: `${paymentLevel.color}10` }}>
              <img src={paymentLevel.image} alt={paymentLevel.name} className="w-10 h-10 mx-auto object-contain mb-1" />
              <p className="text-xs font-bold text-card-foreground">{paymentLevel.name}</p>
              <p className="text-[10px] text-muted-foreground">To'lov darajasi</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: `${referralLevel.color}10` }}>
              <img src={referralLevel.image} alt={referralLevel.name} className="w-10 h-10 mx-auto object-contain mb-1" />
              <p className="text-xs font-bold text-card-foreground">{referralLevel.name}</p>
              <p className="text-[10px] text-muted-foreground">Referal darajasi</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4">
          <h4 className="text-sm font-bold text-card-foreground mb-3">Admin amallar</h4>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={coinAdjust}
              onChange={(e) => setCoinAdjust(e.target.value)}
              placeholder="Miqdor"
              className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground"
            />
            <button onClick={() => adjustCoins(parseInt(coinAdjust) || 0)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1"
              style={{ background: 'hsl(145 40% 45%)' }}
            >
              <ArrowUpCircle className="w-3.5 h-3.5" /> Qo'shish
            </button>
            <button onClick={() => adjustCoins(-(parseInt(coinAdjust) || 0))}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1"
              style={{ background: 'hsl(0 75% 50%)' }}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" /> Ayirish
            </button>
          </div>
          <button onClick={addTreeGrown}
            className="w-full py-2 rounded-xl text-xs font-bold bg-muted text-card-foreground flex items-center justify-center gap-2 mb-3"
          >
            <Gift className="w-3.5 h-3.5" /> Daraxt berish (+1)
          </button>

          <h5 className="text-xs font-bold text-card-foreground mb-2">Meva berish</h5>
          <div className="flex gap-2">
            <select
              value={fruitType}
              onChange={(e) => setFruitType(e.target.value as any)}
              className="bg-muted rounded-xl px-2 py-2 text-xs text-card-foreground"
            >
              <option value="apple">{TREE_CONFIGS.apple.emoji} Olma</option>
              <option value="pear">{TREE_CONFIGS.pear.emoji} Nok</option>
              <option value="grape">{TREE_CONFIGS.grape.emoji} Uzum</option>
              <option value="fig">{TREE_CONFIGS.fig.emoji} Anjir</option>
            </select>
            <input
              type="number"
              value={fruitAmount}
              onChange={(e) => setFruitAmount(e.target.value)}
              placeholder="Miqdor"
              className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs text-card-foreground placeholder:text-muted-foreground"
            />
            <button onClick={async () => {
              if (!selectedUser || !fruitAmount) return;
              const key = `fruits_${fruitType}` as keyof DbUserRow;
              const current = selectedUser[key] as number;
              const newVal = Math.max(0, current + (parseInt(fruitAmount) || 0));
              await supabase.from('users').update({ [`fruits_${fruitType}`]: newVal } as any).eq('telegram_id', selectedUser.telegram_id);
              setSelectedUser({ ...selectedUser, [key]: newVal });
              setUsers(prev => prev.map(u => u.telegram_id === selectedUser.telegram_id ? { ...u, [key]: newVal } : u));
              setFruitAmount('');
            }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1"
              style={{ background: 'hsl(145 40% 45%)' }}
            >
              <Gift className="w-3.5 h-3.5" /> Berish
            </button>
          </div>

          <h5 className="text-xs font-bold text-card-foreground mb-2 mt-4">🎫 Chipta berish</h5>
          <TicketAdmin selectedUser={selectedUser} setSelectedUser={setSelectedUser} setUsers={setUsers} />
        </div>
      </div>
    );
  }

  function TicketAdmin({ selectedUser, setSelectedUser, setUsers }: { selectedUser: DbUserRow; setSelectedUser: (u: DbUserRow) => void; setUsers: React.Dispatch<React.SetStateAction<DbUserRow[]>> }) {
    const [ticketType, setTicketType] = useState<'yellow' | 'green' | 'red'>('yellow');
    const [ticketAmount, setTicketAmount] = useState('');

    const ticketKey = ticketType === 'yellow' ? 'tickets_yellow' : ticketType === 'green' ? 'tickets_green' : 'tickets_red';
    const currentVal = (selectedUser as any)[ticketKey] ?? 0;

    const handleAddTicket = async () => {
      if (!ticketAmount) return;
      const newVal = Math.max(0, currentVal + (parseInt(ticketAmount) || 0));
      await supabase.from('users').update({ [ticketKey]: newVal } as any).eq('telegram_id', selectedUser.telegram_id);
      const updated = { ...selectedUser, [ticketKey]: newVal } as any;
      setSelectedUser(updated);
      setUsers((prev: DbUserRow[]) => prev.map(u => u.telegram_id === selectedUser.telegram_id ? updated : u));
      setTicketAmount('');
    };

    return (
      <div className="flex gap-2">
        <select
          value={ticketType}
          onChange={(e) => setTicketType(e.target.value as any)}
          className="bg-muted rounded-xl px-2 py-2 text-xs text-card-foreground"
        >
          <option value="yellow">🟡 Sariq ({currentVal})</option>
          <option value="green">🟢 Yashil ({(selectedUser as any).tickets_green ?? 0})</option>
          <option value="red">🔴 Qizil ({(selectedUser as any).tickets_red ?? 0})</option>
        </select>
        <input
          type="number"
          value={ticketAmount}
          onChange={(e) => setTicketAmount(e.target.value)}
          placeholder="Miqdor"
          className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs text-card-foreground placeholder:text-muted-foreground"
        />
        <button onClick={handleAddTicket}
          className="px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1"
          style={{ background: 'hsl(145 40% 45%)' }}
        >
          <Gift className="w-3.5 h-3.5" /> Berish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Telegram ID yoki username..."
          className="w-full bg-card border border-border rounded-2xl pl-10 pr-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground"
        />
      </div>

      {users.map(user => (
        <button
          key={user.telegram_id}
          onClick={() => { setSelectedUser(user); loadReferralCount(user.telegram_id); }}
          className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(0 75% 50% / 0.1)' }}>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground">{user.first_name}</p>
            <p className="text-xs text-muted-foreground">@{user.username} | {user.coins.toLocaleString()} tanga</p>
          </div>
          <span className="text-muted-foreground text-sm">→</span>
        </button>
      ))}

      {users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Foydalanuvchi topilmadi</p>
        </div>
      )}
    </div>
  );
}

function WithdrawalsSection() {
  const [withdrawals, setWithdrawals] = useState<PaymentRequest[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number>(0);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    const { data } = await supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setWithdrawals(data as unknown as PaymentRequest[]);
  };

  const filtered = selectedLevel === 0
    ? withdrawals
    : withdrawals.filter(w => w.payment_level_id === selectedLevel);

  const pending = filtered.filter(w => w.status === 'pending');
  const approved = filtered.filter(w => w.status === 'approved');
  const processed = filtered.filter(w => w.status === 'paid' || w.status === 'rejected');

  const handleApprove = async (id: string) => {
    const w = withdrawals.find(w => w.id === id);
    await supabase.from('payment_requests').update({
      status: 'approved',
    } as any).eq('id', id);
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'approved' as const } : w));

    if (w) {
      try {
        await supabase.functions.invoke('telegram-bot', {
          body: {
            action: 'notify_payment',
            user_telegram_id: w.user_telegram_id,
            amount: w.amount,
            amount_uzs: w.amount_uzs,
            status: 'approved',
          },
        });
      } catch (e) {
        console.error('Failed to send approval notification:', e);
      }
    }
  };

  const handleMarkPaid = async (id: string) => {
    const w = withdrawals.find(w => w.id === id);
    await supabase.from('payment_requests').update({
      status: 'paid',
      paid_date: new Date().toISOString(),
    } as any).eq('id', id);
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'paid' as const, paid_date: new Date().toISOString() } : w));

    if (w) {
      try {
        await supabase.functions.invoke('telegram-bot', {
          body: {
            action: 'notify_payment',
            user_telegram_id: w.user_telegram_id,
            amount: w.amount,
            amount_uzs: w.amount_uzs,
            status: 'paid',
          },
        });
      } catch (e) {
        console.error('Failed to send payment notification:', e);
      }
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    const w = withdrawals.find(w => w.id === id);
    await supabase.from('payment_requests').update({
      status: 'rejected',
      rejection_reason: rejectReason,
    } as any).eq('id', id);
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected' as const, rejection_reason: rejectReason } : w));
    setRejectingId(null);
    setRejectReason('');

    if (w) {
      try {
        await supabase.functions.invoke('telegram-bot', {
          body: {
            action: 'notify_payment',
            user_telegram_id: w.user_telegram_id,
            amount: w.amount,
            amount_uzs: w.amount_uzs,
            status: 'rejected',
          },
        });
      } catch (e) {
        console.error('Failed to send rejection notification:', e);
      }
    }
  };

  const STATUS_COLORS = {
    pending: { bg: 'hsl(45 90% 55%)', text: 'hsl(45 90% 20%)', label: 'Kutilmoqda' },
    approved: { bg: 'hsl(200 70% 50%)', text: 'hsl(0 0% 100%)', label: "Tasdiqlangan" },
    paid: { bg: 'hsl(145 50% 45%)', text: 'hsl(0 0% 100%)', label: "To'langan" },
    rejected: { bg: 'hsl(0 70% 50%)', text: 'hsl(0 0% 100%)', label: 'Rad etilgan' },
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setSelectedLevel(0)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedLevel === 0 ? 'bg-card text-card-foreground shadow-sm border border-border' : 'bg-muted/50 text-muted-foreground'
            }`}
          >
            Hammasi ({withdrawals.filter(w => w.status === 'pending').length})
          </button>
          {PAYMENT_LEVELS.map(level => {
            const count = withdrawals.filter(w => w.payment_level_id === level.id && w.status === 'pending').length;
            return (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedLevel === level.id ? 'bg-card text-card-foreground shadow-sm border border-border' : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                <img src={level.image} alt={level.name} className="w-4 h-4 object-contain" />
                {level.name}
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] text-white" style={{ background: level.color }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-card-foreground mb-2">Kutilmoqda ({pending.length})</h3>
          <div className="space-y-2.5">
            {pending.map(w => {
              const level = PAYMENT_LEVELS.find(l => l.id === w.payment_level_id) || PAYMENT_LEVELS[0];
              return (
                <div key={w.id} className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {w.photo_url ? (
                        <img src={w.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <img src={level.image} alt={level.name} className="w-6 h-6 object-contain" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{w.first_name} (@{w.username})</p>
                        <p className="text-[10px] text-muted-foreground">ID: {w.user_telegram_id} | {new Date(w.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">{w.amount.toLocaleString()} tanga</p>
                      <p className="text-[10px]" style={{ color: 'hsl(145 50% 40%)' }}>{w.amount_uzs.toLocaleString()} UZS</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-2">
                    Tel: {w.phone} | Karta: {w.card_number} | {level.name}
                  </div>

                  {rejectingId === w.id ? (
                    <div className="space-y-2 mt-3">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rad etish sababi..."
                        className="w-full bg-muted rounded-xl px-3 py-2 text-xs text-card-foreground placeholder:text-muted-foreground"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleReject(w.id)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
                          style={{ background: 'hsl(0 75% 50%)' }}
                        >Tasdiqlash</button>
                        <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-muted text-muted-foreground"
                        >Bekor qilish</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleApprove(w.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                        style={{ background: 'hsl(200 70% 50%)' }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tasdiqlash
                      </button>
                      <button onClick={() => setRejectingId(w.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                        style={{ background: 'hsl(0 75% 50%)' }}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Rad etish
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length === 0 && approved.length === 0 && (
        <div className="text-center py-8 bg-card rounded-2xl border border-border">
          <p className="text-sm text-muted-foreground">Kutilayotgan so'rovlar yo'q</p>
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-card-foreground mb-2">Tasdiqlangan — to'lanishi kerak ({approved.length})</h3>
          <div className="space-y-2.5">
            {approved.map(w => {
              const level = PAYMENT_LEVELS.find(l => l.id === w.payment_level_id) || PAYMENT_LEVELS[0];
              return (
                <div key={w.id} className="bg-card rounded-2xl border border-border p-4" style={{ borderColor: 'hsl(200 70% 50% / 0.3)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {w.photo_url ? (
                        <img src={w.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <img src={level.image} alt={level.name} className="w-6 h-6 object-contain" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{w.first_name} (@{w.username})</p>
                        <p className="text-[10px] text-muted-foreground">ID: {w.user_telegram_id} | {new Date(w.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">{w.amount.toLocaleString()} tanga</p>
                      <p className="text-[10px]" style={{ color: 'hsl(145 50% 40%)' }}>{w.amount_uzs.toLocaleString()} UZS</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-2">
                    Tel: {w.phone} | Karta: {w.card_number}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleMarkPaid(w.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                      style={{ background: 'hsl(145 40% 45%)' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> To'landi
                    </button>
                    <button onClick={() => setRejectingId(w.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                      style={{ background: 'hsl(0 75% 50%)' }}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rad etish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {processed.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-card-foreground mb-2">Qayta ishlangan</h3>
          <div className="space-y-2">
            {processed.map(w => {
              const sc = STATUS_COLORS[w.status];
              return (
                <div key={w.id} className="bg-card rounded-2xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-card-foreground">@{w.username} — {w.amount.toLocaleString()} tanga ({w.amount_uzs.toLocaleString()} UZS)</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                      {w.rejection_reason && <p className="text-[10px] text-destructive mt-0.5">Sabab: {w.rejection_reason}</p>}
                    </div>
                    <div className="px-2 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: sc.bg }}>
                      {sc.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelsSection() {
  const [channels, setChannels] = useState<DbChannelTask[]>([]);
  const [newChannelId, setNewChannelId] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newReward, setNewReward] = useState('10');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    const { data } = await supabase
      .from('channel_tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setChannels(data as unknown as DbChannelTask[]);
  };

  const normalizeChannelId = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^-?\d+$/.test(trimmed)) return trimmed;

    const normalized = trimmed
      .replace(/^https?:\/\/(t|telegram)\.me\//i, '')
      .replace(/^(t|telegram)\.me\//i, '')
      .replace(/^@/, '')
      .split(/[/?#]/)[0]
      .trim();

    return normalized ? `@${normalized}` : '';
  };

  const addChannel = async () => {
    if (!newChannelId.trim() || !newChannelName.trim()) return;
    setAdding(true);
    const channelId = normalizeChannelId(newChannelId);
    if (!channelId) {
      setAdding(false);
      return;
    }
    await supabase.from('channel_tasks').insert({
      channel_id: channelId,
      channel_name: newChannelName.trim(),
      reward: parseInt(newReward) || 10,
      is_active: true,
    } as any);
    setNewChannelId('');
    setNewChannelName('');
    setNewReward('10');
    setAdding(false);
    loadChannels();
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from('channel_tasks').update({ is_active: !currentActive } as any).eq('id', id);
    setChannels(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentActive } : c));
  };

  const deleteChannel = async (id: string) => {
    await supabase.from('channel_tasks').delete().eq('id', id);
    setChannels(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Add new channel */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="text-sm font-bold text-card-foreground mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yangi kanal qo'shish
        </h3>
        <div className="space-y-2">
          <input
            type="text"
            value={newChannelId}
            onChange={(e) => setNewChannelId(e.target.value)}
            placeholder="Kanal ID (masalan: @kanal_nomi)"
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground"
          />
          <input
            type="text"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="Kanal nomi"
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={newReward}
              onChange={(e) => setNewReward(e.target.value)}
              placeholder="Mukofot (tanga)"
              className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={addChannel}
              disabled={adding || !newChannelId.trim() || !newChannelName.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 flex items-center gap-1"
              style={{ background: 'hsl(145 40% 45%)' }}
            >
              <Plus className="w-3.5 h-3.5" /> Qo'shish
            </button>
          </div>
        </div>
      </div>

      {/* Existing channels */}
      <div>
        <h3 className="text-sm font-bold text-card-foreground mb-2 flex items-center gap-2">
          <Megaphone className="w-4 h-4" /> Mavjud kanallar ({channels.length})
        </h3>
        {channels.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-2xl border border-border">
            <p className="text-sm text-muted-foreground">Hali kanal qo'shilmagan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {channels.map(channel => (
              <div key={channel.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-card-foreground">{channel.channel_name}</p>
                    <p className="text-xs text-muted-foreground">{channel.channel_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      channel.is_active
                        ? 'text-white'
                        : 'bg-muted text-muted-foreground'
                    }`} style={channel.is_active ? { background: 'hsl(145 50% 45%)' } : {}}>
                      {channel.is_active ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-accent font-bold">{channel.reward} tanga</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(channel.id, channel.is_active)}
                      className="p-2 rounded-xl bg-muted active:scale-95 transition-all"
                      title={channel.is_active ? 'O\'chirish' : 'Yoqish'}
                    >
                      {channel.is_active ? (
                        <ToggleRight className="w-4 h-4" style={{ color: 'hsl(145 50% 45%)' }} />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteChannel(channel.id)}
                      className="p-2 rounded-xl bg-destructive/10 active:scale-95 transition-all"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
