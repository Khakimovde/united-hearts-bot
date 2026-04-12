import { useState, useRef, useCallback, useEffect } from 'react';
import { useGarden } from '@/contexts/GardenContext';
import { CoinBalance } from '@/components/CoinBalance';
import type { TreeType } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import ticketYellowImg from '@/assets/ticket-yellow.png';
import ticketGreenImg from '@/assets/ticket-green.png';
import ticketRedImg from '@/assets/ticket-red.png';

// Get next 2-hour boundary (00:00, 02:00, 04:00, ...) in UZT
function getNextTwoHourReset(): number {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const uzt = new Date(utc + 5 * 3600000);
  const currentHour = uzt.getHours();
  const nextSlot = Math.ceil((currentHour + 1) / 2) * 2;
  const reset = new Date(uzt);
  reset.setHours(nextSlot >= 24 ? 0 : nextSlot, 0, 0, 0);
  if (nextSlot >= 24) reset.setDate(reset.getDate() + 1);
  // Convert back to real timestamp
  return reset.getTime() - 5 * 3600000 - now.getTimezoneOffset() * 60000;
}

function getCurrentTwoHourSlotStart(): number {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const uzt = new Date(utc + 5 * 3600000);
  const currentHour = uzt.getHours();
  const slotStart = Math.floor(currentHour / 2) * 2;
  const start = new Date(uzt);
  start.setHours(slotStart, 0, 0, 0);
  return start.getTime() - 5 * 3600000 - now.getTimezoneOffset() * 60000;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Types ──
type WheelTier = 'yellow' | 'green' | 'red';

interface WheelItem {
  label: string;
  emoji: string;
  color: string;
  borderColor: string;
  value: number;
  type: 'fruit' | 'coin' | 'referral' | 'red_ticket';
  fruitType?: TreeType;
}

// ── Wheel Items ──
const YELLOW_ITEMS: WheelItem[] = [
  { label: '+5 🍎', emoji: '🍎', color: 'hsl(0 70% 55%)', borderColor: 'hsl(0 70% 40%)', value: 5, type: 'fruit', fruitType: 'apple' },
  { label: '+3 🍇', emoji: '🍇', color: 'hsl(270 50% 50%)', borderColor: 'hsl(270 50% 35%)', value: 3, type: 'fruit', fruitType: 'grape' },
  { label: '+4 🍐', emoji: '🍐', color: 'hsl(80 50% 45%)', borderColor: 'hsl(80 50% 32%)', value: 4, type: 'fruit', fruitType: 'pear' },
  { label: '+2 🍎', emoji: '🍎', color: 'hsl(5 60% 58%)', borderColor: 'hsl(5 60% 42%)', value: 2, type: 'fruit', fruitType: 'apple' },
  { label: '+3 🫐', emoji: '🫐', color: 'hsl(240 40% 50%)', borderColor: 'hsl(240 40% 35%)', value: 3, type: 'fruit', fruitType: 'fig' },
  { label: '+5 🍇', emoji: '🍇', color: 'hsl(280 55% 52%)', borderColor: 'hsl(280 55% 38%)', value: 5, type: 'fruit', fruitType: 'grape' },
  { label: '+2 🍐', emoji: '🍐', color: 'hsl(90 45% 48%)', borderColor: 'hsl(90 45% 34%)', value: 2, type: 'fruit', fruitType: 'pear' },
  { label: '+8 🍎', emoji: '🍎', color: 'hsl(355 75% 50%)', borderColor: 'hsl(355 75% 36%)', value: 8, type: 'fruit', fruitType: 'apple' },
  { label: '+2 🫐', emoji: '🫐', color: 'hsl(230 45% 52%)', borderColor: 'hsl(230 45% 38%)', value: 2, type: 'fruit', fruitType: 'fig' },
  { label: '+7 🍇', emoji: '🍇', color: 'hsl(265 50% 48%)', borderColor: 'hsl(265 50% 34%)', value: 7, type: 'fruit', fruitType: 'grape' },
];

const GREEN_ITEMS: WheelItem[] = [
  { label: '+100 🪙', emoji: '🪙', color: 'hsl(45 85% 50%)', borderColor: 'hsl(45 85% 36%)', value: 100, type: 'coin' },
  { label: '+2 👥', emoji: '👥', color: 'hsl(200 60% 50%)', borderColor: 'hsl(200 60% 36%)', value: 2, type: 'referral' },
  { label: '+200 🪙', emoji: '🪙', color: 'hsl(38 80% 48%)', borderColor: 'hsl(38 80% 34%)', value: 200, type: 'coin' },
  { label: '+3 👥', emoji: '👥', color: 'hsl(210 65% 48%)', borderColor: 'hsl(210 65% 34%)', value: 3, type: 'referral' },
  { label: '+300 🪙', emoji: '🪙', color: 'hsl(50 80% 52%)', borderColor: 'hsl(50 80% 38%)', value: 300, type: 'coin' },
  { label: '+1 🎫', emoji: '🎫', color: 'hsl(0 75% 50%)', borderColor: 'hsl(0 75% 36%)', value: 1, type: 'red_ticket' },
  { label: '+400 🪙', emoji: '🪙', color: 'hsl(42 78% 50%)', borderColor: 'hsl(42 78% 36%)', value: 400, type: 'coin' },
  { label: '+5 👥', emoji: '👥', color: 'hsl(205 60% 50%)', borderColor: 'hsl(205 60% 36%)', value: 5, type: 'referral' },
  { label: '+500 🪙', emoji: '🪙', color: 'hsl(35 85% 45%)', borderColor: 'hsl(35 85% 32%)', value: 500, type: 'coin' },
  { label: '+600 🪙', emoji: '🪙', color: 'hsl(30 90% 45%)', borderColor: 'hsl(30 90% 32%)', value: 600, type: 'coin' },
];

const RED_ITEMS: WheelItem[] = [
  { label: '+1000 🪙', emoji: '🪙', color: 'hsl(0 65% 50%)', borderColor: 'hsl(0 65% 36%)', value: 1000, type: 'coin' },
  { label: '+1500 🪙', emoji: '🪙', color: 'hsl(280 60% 50%)', borderColor: 'hsl(280 60% 36%)', value: 1500, type: 'coin' },
  { label: '+2000 🪙', emoji: '🪙', color: 'hsl(350 70% 48%)', borderColor: 'hsl(350 70% 34%)', value: 2000, type: 'coin' },
  { label: '+2500 🪙', emoji: '🪙', color: 'hsl(290 55% 48%)', borderColor: 'hsl(290 55% 34%)', value: 2500, type: 'coin' },
  { label: '+3000 🪙', emoji: '🪙', color: 'hsl(45 95% 50%)', borderColor: 'hsl(45 95% 36%)', value: 3000, type: 'coin' },
  { label: '+3500 🪙', emoji: '🪙', color: 'hsl(5 70% 52%)', borderColor: 'hsl(5 70% 38%)', value: 3500, type: 'coin' },
  { label: '+4000 🪙', emoji: '🪙', color: 'hsl(270 65% 50%)', borderColor: 'hsl(270 65% 36%)', value: 4000, type: 'coin' },
  { label: '+4500 🪙', emoji: '🪙', color: 'hsl(40 90% 48%)', borderColor: 'hsl(40 90% 34%)', value: 4500, type: 'coin' },
  { label: '+5000 🪙', emoji: '🪙', color: 'hsl(50 100% 50%)', borderColor: 'hsl(50 100% 36%)', value: 5000, type: 'coin' },
  { label: '+2000 🪙', emoji: '🪙', color: 'hsl(340 60% 50%)', borderColor: 'hsl(340 60% 36%)', value: 2000, type: 'coin' },
];

interface WheelConfig {
  id: WheelTier;
  name: string;
  description: string;
  ticketImage: string;
  ticketName: string;
  items: WheelItem[];
  accentColor: string;
}

const WHEEL_CONFIGS: WheelConfig[] = [
  {
    id: 'yellow',
    name: 'Meva g\'ildiragi',
    description: 'Sariq chipta bilan aylantiring',
    ticketImage: ticketYellowImg,
    ticketName: 'Sariq chipta',
    items: YELLOW_ITEMS,
    accentColor: 'hsl(45 90% 50%)',
  },
  {
    id: 'green',
    name: 'Tanga g\'ildiragi',
    description: 'Yashil chipta bilan aylantiring',
    ticketImage: ticketGreenImg,
    ticketName: 'Yashil chipta',
    items: GREEN_ITEMS,
    accentColor: 'hsl(145 60% 45%)',
  },
  {
    id: 'red',
    name: 'Jackpot g\'ildiragi',
    description: 'Qizil chipta bilan aylantiring',
    ticketImage: ticketRedImg,
    ticketName: 'Qizil chipta',
    items: RED_ITEMS,
    accentColor: 'hsl(0 70% 50%)',
  },
];

// ── Spin Wheel Component ──
function SpinWheel({ config, tickets, referralCount, onClose, onApplyReward }: {
  config: WheelConfig;
  tickets: number;
  referralCount: number;
  onClose: () => void;
  onApplyReward: (item: WheelItem, tier: WheelTier) => Promise<void>;
}) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const spinRef = useRef(false);

  const items = config.items;
  const segmentAngle = 360 / items.length;
  const canSpin = tickets > 0 && (config.id !== 'red' || referralCount >= 60);

  const handleSpin = useCallback(() => {
    if (spinRef.current || !canSpin) return;
    spinRef.current = true;
    setSpinning(true);
    setShowResult(false);
    setResult(null);

    const winIndex = Math.floor(Math.random() * items.length);
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = 360 - (winIndex * segmentAngle + segmentAngle / 2);
    const totalRotation = extraSpins * 360 + targetAngle;

    setRotation(prev => prev + totalRotation);

    setTimeout(async () => {
      const won = items[winIndex];
      setResult(won);
      setShowResult(true);
      setSpinning(false);
      spinRef.current = false;
      await onApplyReward(won, config.id);
    }, 4200);
  }, [canSpin, items, segmentAngle, config.id, onApplyReward]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'hsla(0 0% 0% / 0.7)' }}>
      <div className="w-full max-w-sm mx-4 rounded-3xl p-5 relative bg-background" style={{
        boxShadow: '0 20px 60px hsla(0 0% 0% / 0.4)',
      }}>
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-lg bg-muted">✕</button>

        <div className="text-center mb-3">
          <h2 className="text-lg font-bold text-card-foreground">{config.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <img src={config.ticketImage} alt="" className="w-6 h-6 object-contain" />
            <span className="text-sm font-bold" style={{ color: config.accentColor }}>{tickets} ta chipta</span>
          </div>
        </div>

        {/* Wheel */}
        <div className="flex justify-center mb-4">
          <div className="relative w-64 h-64">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
              <div className="w-0 h-0" style={{
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '20px solid hsl(0 75% 50%)',
                filter: 'drop-shadow(0 2px 4px hsla(0 0% 0% / 0.3))',
              }} />
            </div>

            <div
              className="w-full h-full rounded-full relative overflow-hidden"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                boxShadow: '0 0 0 5px hsl(25 20% 85%), 0 0 0 9px hsl(0 0% 30%), 0 6px 24px hsla(0 0% 0% / 0.3)',
              }}
            >
              {items.map((item, i) => {
                const startAngle = i * segmentAngle;
                const midAngle = startAngle + segmentAngle / 2;
                return (
                  <div
                    key={i}
                    className="absolute inset-0"
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.sin((startAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((startAngle * Math.PI) / 180)}%, ${50 + 50 * Math.sin(((startAngle + segmentAngle) * Math.PI) / 180)}% ${50 - 50 * Math.cos(((startAngle + segmentAngle) * Math.PI) / 180)}%)`,
                      background: item.color,
                      borderRight: `2px solid ${item.borderColor}`,
                    }}
                  >
                    <div
                      className="absolute text-white font-bold flex items-center gap-0.5"
                      style={{
                        left: `${50 + 30 * Math.sin((midAngle * Math.PI) / 180)}%`,
                        top: `${50 - 30 * Math.cos((midAngle * Math.PI) / 180)}%`,
                        transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                        fontSize: '10px',
                        textShadow: '0 1px 3px hsla(0 0% 0% / 0.5)',
                      }}
                    >
                      <span className="whitespace-nowrap">{item.label}</span>
                    </div>
                  </div>
                );
              })}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-background" style={{
                  boxShadow: '0 2px 8px hsla(0 0% 0% / 0.2)',
                }}>
                  <img src={config.ticketImage} alt="" className="w-7 h-7 object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleSpin}
            disabled={!canSpin || spinning}
            className="btn-cartoon px-8 py-3 text-sm flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {spinning ? '⏳ Aylanmoqda...' : '🎰 Aylantirish'}
          </button>
          {!canSpin && !spinning && (
            <p className="text-xs mt-2" style={{ color: 'hsl(0 75% 50%)' }}>
              {config.id === 'red' && referralCount < 60
                ? `60+ referal kerak (hozir: ${referralCount})`
                : 'Chipta yo\'q'}
            </p>
          )}
        </div>

        {showResult && result && (
          <div className="mt-4 p-3 rounded-2xl text-center animate-scale-in" style={{
            background: 'linear-gradient(135deg, hsl(45 90% 95%), hsl(40 80% 92%))',
            border: '2px solid hsl(45 80% 75%)',
          }}>
            <p className="text-3xl mb-1">{result.emoji}</p>
            <p className="font-bold text-card-foreground text-sm">{result.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {result.type === 'fruit' ? "Mevalaringizga qo'shildi!" :
               result.type === 'coin' ? "Tangalaringizga qo'shildi!" :
               result.type === 'red_ticket' ? "Qizil chipta yutdingiz!" :
               "Referallaringizga qo'shildi!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Lottery Page ──
export default function Lottery() {
  const { userData, triggerAd, refreshUserData } = useGarden();
  const [openWheel, setOpenWheel] = useState<WheelTier | null>(null);

  const [localTickets, setLocalTickets] = useState<{ yellow: number; green: number; red: number } | null>(null);
  const tickets = localTickets ?? { yellow: 0, green: 0, red: 0 };

  const loadTickets = useCallback(async () => {
    if (!userData.telegramId) return;
    const { data } = await supabase
      .from('users')
      .select('tickets_yellow, tickets_green, tickets_red, lottery_ads_watched, lottery_ads_reset_at')
      .eq('telegram_id', userData.telegramId)
      .maybeSingle();
    if (data) {
      setLocalTickets({
        yellow: (data as any).tickets_yellow ?? 0,
        green: (data as any).tickets_green ?? 0,
        red: (data as any).tickets_red ?? 0,
      });
    }
  }, [userData.telegramId]);

  useState(() => { loadTickets(); });

  const referralCount = userData.referral.referredUsers.length;

  // Earn yellow ticket via ads
  const handleEarnYellowTicket = useCallback(() => {
    if (!userData.telegramId) return;

    (async () => {
      const { data } = await supabase
        .from('users')
        .select('lottery_ads_watched, lottery_ads_reset_at')
        .eq('telegram_id', userData.telegramId)
        .maybeSingle();
      if (!data) return;

      const resetAt = new Date((data as any).lottery_ads_reset_at || 0).getTime();
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000;
      let adsWatched = (data as any).lottery_ads_watched ?? 0;

      if (now - resetAt >= twoHours) {
        adsWatched = 0;
      }

      if (adsWatched >= 15) {
        alert('Chipta olish uchun 2 soat kutish kerak!');
        return;
      }

      triggerAd(async () => {
        const newAdsWatched = adsWatched + 1;
        const updates: any = {
          lottery_ads_watched: newAdsWatched,
        };

        if (adsWatched === 0) {
          updates.lottery_ads_reset_at = new Date().toISOString();
        }

        if (newAdsWatched >= 15) {
          updates.tickets_yellow = (tickets.yellow || 0) + 1;
          setLocalTickets(prev => prev ? { ...prev, yellow: prev.yellow + 1 } : { yellow: 1, green: 0, red: 0 });
        }

        await supabase
          .from('users')
          .update(updates as any)
          .eq('telegram_id', userData.telegramId);

        if (newAdsWatched >= 15) {
          alert('🎫 Sariq chipta oldingiz!');
        } else {
          alert(`Reklama ${newAdsWatched}/15 ko'rildi`);
        }
      }, 1);
    })();
  }, [userData.telegramId, tickets.yellow, triggerAd]);

  // Apply reward after spin
  const handleApplyReward = useCallback(async (item: WheelItem, tier: WheelTier) => {
    if (!userData.telegramId) return;

    const ticketKey = tier === 'yellow' ? 'tickets_yellow' : tier === 'green' ? 'tickets_green' : 'tickets_red';
    const updates: Record<string, any> = {
      [ticketKey]: Math.max(0, (tickets[tier] || 0) - 1),
    };

    if (item.type === 'fruit' && item.fruitType) {
      const fruitKey = `fruits_${item.fruitType}`;
      const { data: user } = await supabase.from('users').select(fruitKey).eq('telegram_id', userData.telegramId).maybeSingle();
      if (user) {
        updates[fruitKey] = ((user as any)[fruitKey] ?? 0) + item.value;
      }
    } else if (item.type === 'coin') {
      const { data: user } = await supabase.from('users').select('coins').eq('telegram_id', userData.telegramId).maybeSingle();
      if (user) {
        updates.coins = (user.coins ?? 0) + item.value;
      }
    } else if (item.type === 'red_ticket') {
      updates.tickets_red = (tickets.red || 0) + 1;
    } else if (item.type === 'referral') {
      const { data: user } = await supabase.from('users').select('coins').eq('telegram_id', userData.telegramId).maybeSingle();
      if (user) {
        updates.coins = (user.coins ?? 0) + item.value * 10;
      }
    }

    await supabase.from('users').update(updates as any).eq('telegram_id', userData.telegramId);

    setLocalTickets(prev => {
      if (!prev) return prev;
      const newTickets = { ...prev };
      newTickets[tier] = Math.max(0, newTickets[tier] - 1);
      if (item.type === 'red_ticket') newTickets.red += 1;
      return newTickets;
    });

    await refreshUserData();
  }, [userData.telegramId, tickets, refreshUserData]);

  const getWheelTickets = (tier: WheelTier) => tickets[tier] || 0;

  return (
    <div className="px-4 py-3 pb-28 bg-background" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">Lotereya</h1>
        <CoinBalance />
      </div>

      {/* Ticket summary - white bg, centered tickets */}
      <div className="flex items-center justify-center gap-4 mb-5 p-3 rounded-2xl bg-background" style={{ border: '1.5px solid hsl(25 15% 88%)' }}>
        <div className="flex items-center gap-1.5">
          <img src={ticketYellowImg} alt="" className="w-8 h-8 object-contain" />
          <span className="text-sm font-bold text-card-foreground">{tickets.yellow}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <img src={ticketGreenImg} alt="" className="w-8 h-8 object-contain" />
          <span className="text-sm font-bold text-card-foreground">{tickets.green}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <img src={ticketRedImg} alt="" className="w-8 h-8 object-contain" />
          <span className="text-sm font-bold text-card-foreground">{tickets.red}</span>
        </div>
      </div>

      {/* 3 Wheel Cards - no colored bg, white cards */}
      <div className="space-y-3">
        {WHEEL_CONFIGS.map(cfg => {
          const t = getWheelTickets(cfg.id);
          return (
            <button
              key={cfg.id}
              onClick={() => setOpenWheel(cfg.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-transform active:scale-[0.98] bg-background"
              style={{
                border: '2px solid hsl(25 20% 88%)',
                boxShadow: '0 4px 16px hsla(0 0% 0% / 0.06)',
              }}
            >
              {/* Ticket image instead of lock */}
              <div className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center relative overflow-hidden bg-background" style={{
                boxShadow: `0 0 0 3px hsl(25 20% 85%), 0 4px 12px hsla(0 0% 0% / 0.15)`,
              }}>
                <img src={cfg.ticketImage} alt="" className="w-10 h-10 object-contain" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-card-foreground">{cfg.name}</p>
                  {t > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: cfg.accentColor }}>
                      {t} chipta
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{cfg.description}</p>
                {cfg.id === 'red' && referralCount < 60 && (
                  <p className="text-xs font-bold mt-1" style={{ color: 'hsl(0 75% 50%)' }}>
                    {referralCount}/60 referal kerak
                  </p>
                )}
              </div>

              <div className="text-muted-foreground">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>

      {/* Earn ticket button */}
      <div className="mt-5 space-y-2">
        <button
          onClick={handleEarnYellowTicket}
          className="btn-cartoon w-full py-3 text-sm flex items-center justify-center gap-2"
        >
          <img src={ticketYellowImg} alt="" className="w-5 h-5 object-contain" />
          Sariq chipta olish (15 reklama)
        </button>
      </div>

      {/* Guide */}
      <div className="card-flat mt-5 p-4">
        <h3 className="font-bold text-card-foreground text-sm mb-2">💡 Qanday ishlaydi?</h3>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>• 🟡 Sariq chipta — 2 soatda 15 reklama ko'rib oling</p>
          <p>• 🟢 Yashil chipta — vazifalar bo'limidan oling (7 referal)</p>
          <p>• 🔴 Qizil chipta — vazifalar bo'limidan oling (60 referal)</p>
          <p>• Har bir g'ildirak o'z chiptasi bilan aylanadi</p>
        </div>
      </div>

      {/* Wheel Modal */}
      {openWheel && (
        <SpinWheel
          config={WHEEL_CONFIGS.find(c => c.id === openWheel)!}
          tickets={getWheelTickets(openWheel)}
          referralCount={referralCount}
          onClose={() => setOpenWheel(null)}
          onApplyReward={handleApplyReward}
        />
      )}
    </div>
  );
}
