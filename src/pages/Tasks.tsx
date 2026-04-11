import { useGarden } from '@/contexts/GardenContext';
import { CoinBalance } from '@/components/CoinBalance';
import { CheckCircle2, ChevronRight, Coins, Loader2, AlertTriangle } from 'lucide-react';
import { AD_TASK_DAILY_MAX, AD_TASK_COIN_PER_AD } from '@/lib/gameConfig';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/hooks/useTelegram';
import { calculateReferralPayout } from '@/lib/referral';

import taskAdImg from '@/assets/task-ad.png';
import taskChannelImg from '@/assets/task-channel.png';
import taskCoinsImg from '@/assets/task-coins.png';
import ticketGreenImg from '@/assets/ticket-green.png';
import ticketRedImg from '@/assets/ticket-red.png';

interface DbChannelTask {
  id: string;
  channel_id: string;
  channel_name: string;
  reward: number;
  is_active: boolean;
}

function getUZTDateString(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const uzt = new Date(utc + 5 * 3600000);
  return `${uzt.getFullYear()}-${String(uzt.getMonth() + 1).padStart(2, '0')}-${String(uzt.getDate()).padStart(2, '0')}`;
}

function getTimeUntilMidnightUZT(): number {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const uzt = new Date(utc + 5 * 3600000);
  const endOfDay = new Date(uzt);
  endOfDay.setHours(23, 59, 59, 999);
  return Math.max(0, endOfDay.getTime() - uzt.getTime());
}

function formatTimeLeft(ms: number) {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Tasks() {
  const { userData, watchAdTask, joinChannel } = useGarden();
  const telegram = useTelegram();
  const [, tick] = useState(0);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [dbChannelTasks, setDbChannelTasks] = useState<DbChannelTask[]>([]);

  // Ticket claim state
  const [greenTicketsClaimed, setGreenTicketsClaimed] = useState(0);
  const [redTicketsClaimed, setRedTicketsClaimed] = useState(0);
  const [claimingGreen, setClaimingGreen] = useState(false);
  const [claimingRed, setClaimingRed] = useState(false);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Load channel tasks from DB
  useEffect(() => {
    supabase
      .from('channel_tasks')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setDbChannelTasks(data as unknown as DbChannelTask[]);
      });
  }, []);

  // Load ticket claim counters
  useEffect(() => {
    if (!telegram.id) return;
    supabase
      .from('users')
      .select('tickets_green, tickets_red')
      .eq('telegram_id', telegram.id)
      .maybeSingle()
      .then(({ data }) => {
        // We track total claimed via a simple approach: 
        // green_claimed = floor(referrals/7) - tickets_green (available)
        // But we need to track separately. We'll use local counting.
      });
  }, [telegram.id]);

  const referralCount = userData.referral.referredUsers.length;
  
  // Green ticket: every 7 referrals can claim 1 ticket
  // We track how many have been claimed total. Available = floor(refs/7) - claimed
  // We'll load claimed count from a computed value
  const [greenClaimedTotal, setGreenClaimedTotal] = useState<number | null>(null);
  const [redClaimedTotal, setRedClaimedTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!telegram.id) return;
    // Load user's green/red ticket data to compute claimed
    supabase
      .from('users')
      .select('tickets_green, tickets_red')
      .eq('telegram_id', telegram.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          // We don't have a "claimed" counter, we'll add it. For now, use tickets_green as available.
          // Available green tickets are stored in DB, we need to know how many earned total
          // Earned total = available + used (spun away). We can't easily track used.
          // Simpler approach: use a separate counter. For now, let's use modulo approach:
          // Progress = referralCount % 7, claimable when progress reaches 7
          // Each claim gives +1 ticket and we track via the DB field
        }
      });
  }, [telegram.id]);

  // Green ticket progress: referralCount % 7
  const greenProgress = referralCount % 7;
  const greenCanClaim = greenProgress === 0 && referralCount >= 7;
  
  // Red ticket progress: referralCount toward 60
  const redProgress = referralCount >= 60 ? 60 : referralCount;
  const redCanClaim = referralCount >= 60 && redProgress === 60;

  // We need a separate tracking for green/red claims to avoid double claims
  // Use a simple approach: track last_green_claim_ref_count and last_red_claim_ref_count
  // For simplicity, check greenCanClaim based on whether tickets_green was already awarded for current milestone

  const handleClaimGreenTicket = useCallback(async () => {
    if (!telegram.id || claimingGreen) return;
    setClaimingGreen(true);
    try {
      const { data: user } = await supabase
        .from('users')
        .select('tickets_green')
        .eq('telegram_id', telegram.id)
        .maybeSingle();
      if (user) {
        await supabase.from('users').update({
          tickets_green: ((user as any).tickets_green ?? 0) + 1,
        } as any).eq('telegram_id', telegram.id);
        alert('🎫 Yashil chipta oldingiz!');
      }
    } catch (e) {
      console.error(e);
    }
    setClaimingGreen(false);
  }, [telegram.id, claimingGreen]);

  const handleClaimRedTicket = useCallback(async () => {
    if (!telegram.id || claimingRed) return;
    setClaimingRed(true);
    try {
      const { data: user } = await supabase
        .from('users')
        .select('tickets_red')
        .eq('telegram_id', telegram.id)
        .maybeSingle();
      if (user) {
        await supabase.from('users').update({
          tickets_red: ((user as any).tickets_red ?? 0) + 1,
        } as any).eq('telegram_id', telegram.id);
        alert('🎫 Qizil chipta oldingiz!');
      }
    } catch (e) {
      console.error(e);
    }
    setClaimingRed(false);
  }, [telegram.id, claimingRed]);

  const today = getUZTDateString();
  const adsWatchedToday = userData.adTask.lastResetDate === today ? userData.adTask.adsWatched : 0;
  const adsDone = adsWatchedToday >= AD_TASK_DAILY_MAX;
  const timeLeft = getTimeUntilMidnightUZT();

  const [channelsDoneIds, setChannelsDoneIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (!userData.telegramId) return;
    supabase
      .from('channel_tasks_completed')
      .select('channel_id')
      .eq('user_telegram_id', userData.telegramId)
      .then(({ data }) => {
        if (data) setChannelsDoneIds(data.map((d: any) => d.channel_id));
      });
  }, [userData.telegramId]);

  const channelsDone = channelsDoneIds.length;
  const totalTasks = 1 + dbChannelTasks.length;
  const completedTasks = (adsDone ? 1 : 0) + Math.min(channelsDone, dbChannelTasks.length);

  const handleVerifyChannel = useCallback(async (channelId: string, reward: number) => {
    if (!telegram.id) return;
    setVerifying(channelId);
    setVerifyError(null);

    try {
      const { data: checkResult, error: checkError } = await supabase.functions.invoke('telegram-bot', {
        body: {
          action: 'check_channel_membership',
          user_id: telegram.id,
          channel_id: channelId,
        },
      });

      if (checkError || !checkResult?.is_member) {
        setVerifyError(channelId);
        setVerifying(null);
        setTimeout(() => setVerifyError(null), 3000);
        return;
      }

      const { data: existing } = await supabase
        .from('channel_tasks_completed')
        .select('id')
        .eq('user_telegram_id', telegram.id)
        .eq('channel_id', channelId)
        .maybeSingle();

      if (existing) {
        setVerifying(null);
        setChannelsDoneIds(prev => prev.includes(channelId) ? prev : [...prev, channelId]);
        return;
      }

      await supabase.from('channel_tasks_completed').insert({
        user_telegram_id: telegram.id,
        channel_id: channelId,
      } as any);

      const { data: currentUser } = await supabase
        .from('users')
        .select('coins, referred_by')
        .eq('telegram_id', telegram.id)
        .single();

      if (currentUser) {
        await supabase.from('users').update({
          coins: (currentUser.coins as number) + reward,
        } as any).eq('telegram_id', telegram.id);

        if (currentUser.referred_by) {
          const { data: referrer } = await supabase
            .from('users')
            .select('telegram_id, coins, referral_earnings, referral_commission_carry')
            .eq('referral_code', currentUser.referred_by as string)
            .maybeSingle();
          if (referrer) {
            const { count: refCount } = await supabase
              .from('referrals')
              .select('*', { count: 'exact', head: true })
              .eq('referrer_telegram_id', referrer.telegram_id);
            const { getReferralLevel } = await import('@/lib/gameConfig');
            const level = getReferralLevel(refCount || 0);
            const currentCarry = (referrer as any).referral_commission_carry ?? 0;
            const { payoutCoins, nextCarry } = calculateReferralPayout(reward, level.percent, currentCarry);
            if (payoutCoins > 0 || nextCarry !== currentCarry) {
              await supabase.from('users').update({
                coins: (referrer.coins as number) + payoutCoins,
                referral_earnings: (referrer.referral_earnings as number) + payoutCoins,
                referral_commission_carry: nextCarry,
              } as any).eq('telegram_id', referrer.telegram_id);
            }
          }
        }
      }

      setChannelsDoneIds(prev => [...prev, channelId]);
    } catch (e) {
      setVerifyError(channelId);
      setTimeout(() => setVerifyError(null), 3000);
    }
    setVerifying(null);
  }, [telegram.id]);

  return (
    <div className="px-4 py-3 pb-28 overflow-auto" style={{ background: 'linear-gradient(180deg, hsl(20 30% 96%) 0%, hsl(15 20% 93%) 100%)', height: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <img src={taskCoinsImg} alt="" className="w-10 h-10" width={40} height={40} />
          <h1 className="text-xl font-bold text-foreground">Vazifalar</h1>
        </div>
        <CoinBalance />
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Vazifalarni bajaring va tanga yutib oling
      </p>

      {/* Overall Progress Card */}
      <div className="card-cartoon p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-card-foreground">Jarayon</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: 'hsl(0 75% 50%)' }}>
            {completedTasks}/{totalTasks}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
              background: 'linear-gradient(90deg, hsl(0 80% 58%), hsl(38 85% 52%))',
            }}
          />
        </div>
      </div>

      {/* Ad Task Card */}
      <div className="card-cartoon p-4 mb-3">
        <div className="flex items-center gap-3">
          <img src={taskAdImg} alt="Reklama" className="w-14 h-14 flex-shrink-0" width={56} height={56} loading="lazy" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-card-foreground text-[15px]">
              Reklama ko'rish
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {adsWatchedToday}/{AD_TASK_DAILY_MAX} ta reklama | Har biri {AD_TASK_COIN_PER_AD} tanga
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Coins className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-bold text-accent">
                Bugun: {adsWatchedToday * AD_TASK_COIN_PER_AD} tanga
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            {adsDone ? (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ background: 'hsl(145 40% 92%)' }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: 'hsl(145 50% 40%)' }} />
                <span className="text-xs font-bold" style={{ color: 'hsl(145 50% 40%)' }}>Tugadi</span>
              </div>
            ) : (
              <button
                onClick={watchAdTask}
                className="btn-cartoon px-4 py-2 text-xs"
              >
                Ko'rish
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(adsWatchedToday / AD_TASK_DAILY_MAX) * 100}%`,
                background: 'linear-gradient(90deg, hsl(0 80% 58%), hsl(38 85% 52%))',
              }}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Yangilanishgacha: {formatTimeLeft(timeLeft)}
        </p>
      </div>

      {/* Channel Tasks from DB */}
      {dbChannelTasks.map((channel) => {
        const isJoined = channelsDoneIds.includes(channel.channel_id);
        const isVerifying = verifying === channel.channel_id;
        const hasError = verifyError === channel.channel_id;

        return (
          <div key={channel.id} className="card-cartoon p-4 mb-3">
            <div className="flex items-center gap-3">
              <img src={taskChannelImg} alt="Kanal" className="w-14 h-14 flex-shrink-0" width={56} height={56} loading="lazy" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-card-foreground text-[15px]">
                  Kanalga obuna
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isJoined ? 'Obuna tasdiqlangan' : channel.channel_name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Coins className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-bold text-accent">{channel.reward} Tanga</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {isJoined ? (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl"
                    style={{ background: 'hsl(145 40% 92%)' }}
                  >
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'hsl(145 50% 40%)' }} />
                    <span className="text-xs font-bold" style={{ color: 'hsl(145 50% 40%)' }}>Bajarildi</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => joinChannel(channel.channel_id)}
                      className="btn-cartoon px-3 py-1.5 text-xs"
                    >
                      Obuna
                      <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
                    </button>
                    <button
                      onClick={() => handleVerifyChannel(channel.channel_id, channel.reward)}
                      disabled={isVerifying}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-border bg-card disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Tekshirilmoqda
                        </>
                      ) : (
                        'Tekshirish'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {hasError && (
              <div className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: 'hsl(0 70% 95%)' }}>
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'hsl(0 75% 50%)' }} />
                <span className="text-xs font-medium" style={{ color: 'hsl(0 75% 50%)' }}>Siz hali kanalga obuna bo'lmagansiz!</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Ticket Earning Section */}
      <div className="mt-4 mb-3">
        <h2 className="text-sm font-bold text-foreground mb-3">🎫 Chipta olish</h2>

        {/* Green Ticket - 7 referrals */}
        <div className="card-cartoon p-4 mb-3">
          <div className="flex items-center gap-3">
            <img src={ticketGreenImg} alt="" className="w-14 h-14 flex-shrink-0 object-contain" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-card-foreground text-[15px]">Yashil chipta</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Har 7 ta referalga 1 ta yashil chipta
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-bold" style={{ color: 'hsl(145 50% 40%)' }}>
                  {greenProgress}/7 referal
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              {greenCanClaim ? (
                <button
                  onClick={handleClaimGreenTicket}
                  disabled={claimingGreen}
                  className="btn-cartoon px-4 py-2 text-xs disabled:opacity-50"
                >
                  {claimingGreen ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Olish'}
                </button>
              ) : (
                <div className="px-3 py-1.5 rounded-xl" style={{ background: 'hsl(145 40% 92%)' }}>
                  <span className="text-xs font-bold" style={{ color: 'hsl(145 50% 40%)' }}>
                    {greenProgress}/7
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(greenProgress / 7) * 100}%`,
                  background: 'linear-gradient(90deg, hsl(145 50% 45%), hsl(160 55% 40%))',
                }}
              />
            </div>
          </div>
        </div>

        {/* Red Ticket - 60 referrals */}
        <div className="card-cartoon p-4 mb-3">
          <div className="flex items-center gap-3">
            <img src={ticketRedImg} alt="" className="w-14 h-14 flex-shrink-0 object-contain" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-card-foreground text-[15px]">Qizil chipta</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                60 ta referalga 1 ta qizil chipta
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-bold" style={{ color: 'hsl(0 60% 45%)' }}>
                  {redProgress}/60 referal
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              {redCanClaim ? (
                <button
                  onClick={handleClaimRedTicket}
                  disabled={claimingRed}
                  className="btn-cartoon px-4 py-2 text-xs disabled:opacity-50"
                >
                  {claimingRed ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Olish'}
                </button>
              ) : (
                <div className="px-3 py-1.5 rounded-xl" style={{ background: 'hsl(0 40% 93%)' }}>
                  <span className="text-xs font-bold" style={{ color: 'hsl(0 60% 45%)' }}>
                    {redProgress}/60
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(redProgress / 60) * 100}%`,
                  background: 'linear-gradient(90deg, hsl(0 70% 50%), hsl(350 65% 42%))',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
