import { useState, useRef, useCallback } from 'react';
import { useGarden } from '@/contexts/GardenContext';
import { CoinBalance } from '@/components/CoinBalance';
import { TREE_CONFIGS } from '@/lib/gameConfig';
import type { TreeType } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import ticketYellowImg from '@/assets/ticket-yellow.png';
import ticketGreenImg from '@/assets/ticket-green.png';
import ticketRedImg from '@/assets/ticket-red.png';

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
  { label: 'Olma +5', emoji: '🍎', color: 'hsl(0 70% 55%)', borderColor: 'hsl(0 70% 40%)', value: 5, type: 'fruit', fruitType: 'apple' },
  { label: 'Uzum +3', emoji: '🍇', color: 'hsl(270 50% 50%)', borderColor: 'hsl(270 50% 35%)', value: 3, type: 'fruit', fruitType: 'grape' },
  { label: 'Nok +4', emoji: '🍐', color: 'hsl(80 50% 45%)', borderColor: 'hsl(80 50% 32%)', value: 4, type: 'fruit', fruitType: 'pear' },
  { label: 'Olma +2', emoji: '🍎', color: 'hsl(5 60% 58%)', borderColor: 'hsl(5 60% 42%)', value: 2, type: 'fruit', fruitType: 'apple' },
  { label: 'Anjir +3', emoji: '🫐', color: 'hsl(240 40% 50%)', borderColor: 'hsl(240 40% 35%)', value: 3, type: 'fruit', fruitType: 'fig' },
  { label: 'Uzum +5', emoji: '🍇', color: 'hsl(280 55% 52%)', borderColor: 'hsl(280 55% 38%)', value: 5, type: 'fruit', fruitType: 'grape' },
  { label: 'Nok +2', emoji: '🍐', color: 'hsl(90 45% 48%)', borderColor: 'hsl(90 45% 34%)', value: 2, type: 'fruit', fruitType: 'pear' },
  { label: 'Olma +8', emoji: '🍎', color: 'hsl(355 75% 50%)', borderColor: 'hsl(355 75% 36%)', value: 8, type: 'fruit', fruitType: 'apple' },
  { label: 'Anjir +2', emoji: '🫐', color: 'hsl(230 45% 52%)', borderColor: 'hsl(230 45% 38%)', value: 2, type: 'fruit', fruitType: 'fig' },
  { label: 'Uzum +7', emoji: '🍇', color: 'hsl(265 50% 48%)', borderColor: 'hsl(265 50% 34%)', value: 7, type: 'fruit', fruitType: 'grape' },
];

const GREEN_ITEMS: WheelItem[] = [
  { label: '+100 tanga', emoji: '🪙', color: 'hsl(45 85% 50%)', borderColor: 'hsl(45 85% 36%)', value: 100, type: 'coin' },
  { label: '+2 referal', emoji: '👥', color: 'hsl(200 60% 50%)', borderColor: 'hsl(200 60% 36%)', value: 2, type: 'referral' },
  { label: '+200 tanga', emoji: '💰', color: 'hsl(38 80% 48%)', borderColor: 'hsl(38 80% 34%)', value: 200, type: 'coin' },
  { label: '+3 referal', emoji: '👥', color: 'hsl(210 65% 48%)', borderColor: 'hsl(210 65% 34%)', value: 3, type: 'referral' },
  { label: '+300 tanga', emoji: '🪙', color: 'hsl(50 80% 52%)', borderColor: 'hsl(50 80% 38%)', value: 300, type: 'coin' },
  { label: '🎫 Qizil chipta', emoji: '🎫', color: 'hsl(0 75% 50%)', borderColor: 'hsl(0 75% 36%)', value: 1, type: 'red_ticket' },
  { label: '+400 tanga', emoji: '💰', color: 'hsl(42 78% 50%)', borderColor: 'hsl(42 78% 36%)', value: 400, type: 'coin' },
  { label: '+5 referal', emoji: '👥', color: 'hsl(205 60% 50%)', borderColor: 'hsl(205 60% 36%)', value: 5, type: 'referral' },
  { label: '+500 tanga', emoji: '💎', color: 'hsl(35 85% 45%)', borderColor: 'hsl(35 85% 32%)', value: 500, type: 'coin' },
  { label: '+600 tanga', emoji: '💰', color: 'hsl(30 90% 45%)', borderColor: 'hsl(30 90% 32%)', value: 600, type: 'coin' },
];

const RED_ITEMS: WheelItem[] = [
  { label: '+1000 tanga', emoji: '💰', color: 'hsl(0 65% 50%)', borderColor: 'hsl(0 65% 36%)', value: 1000, type: 'coin' },
  { label: '+1500 tanga', emoji: '💎', color: 'hsl(280 60% 50%)', borderColor: 'hsl(280 60% 36%)', value: 1500, type: 'coin' },
  { label: '+2000 tanga', emoji: '💰', color: 'hsl(350 70% 48%)', borderColor: 'hsl(350 70% 34%)', value: 2000, type: 'coin' },
  { label: '+2500 tanga', emoji: '💎', color: 'hsl(290 55% 48%)', borderColor: 'hsl(290 55% 34%)', value: 2500, type: 'coin' },
  { label: '+3000 tanga', emoji: '👑', color: 'hsl(45 95% 50%)', borderColor: 'hsl(45 95% 36%)', value: 3000, type: 'coin' },
  { label: '+3500 tanga', emoji: '💰', color: 'hsl(5 70% 52%)', borderColor: 'hsl(5 70% 38%)', value: 3500, type: 'coin' },
  { label: '+4000 tanga', emoji: '💎', color: 'hsl(270 65% 50%)', borderColor: 'hsl(270 65% 36%)', value: 4000, type: 'coin' },
  { label: '+4500 tanga', emoji: '🏆', color: 'hsl(40 90% 48%)', borderColor: 'hsl(40 90% 34%)', value: 4500, type: 'coin' },
  { label: '+5000 tanga', emoji: '🌟', color: 'hsl(50 100% 50%)', borderColor: 'hsl(50 100% 36%)', value: 5000, type: 'coin' },
  { label: '+2000 tanga', emoji: '💰', color: 'hsl(340 60% 50%)', borderColor: 'hsl(340 60% 36%)', value: 2000, type: 'coin' },
];

interface WheelConfig {
  id: WheelTier;
  name: string;
  description: string;
  ticketImage: string;
  ticketName: string;
  items: WheelItem[];
  gradient: string;
  accentColor: string;
}

const WHEEL_CONFIGS: WheelConfig[] = [
  {
    id: 'yellow',
    name: 'Meva g\'ildiragi',
    description: 'Har 2 soatda 15 ta reklama = 1 sariq chipta',
    ticketImage: ticketYellowImg,
    ticketName: 'Sariq chipta',
    items: YELLOW_ITEMS,
    gradient: 'linear-gradient(135deg, hsl(45 90% 55%), hsl(35 85% 45%))',
    accentColor: 'hsl(45 90% 50%)',
  },
  {
    id: 'green',
    name: 'Tanga g\'ildiragi',
    description: 'Har 7 ta referalga 1 yashil chipta',
    ticketImage: ticketGreenImg,
    ticketName: 'Yashil chipta',
    items: GREEN_ITEMS,
    gradient: 'linear-gradient(135deg, hsl(145 60% 45%), hsl(160 55% 35%))',
    accentColor: 'hsl(145 60% 45%)',
  },
  {
    id: 'red',
    name: 'Jackpot g\'ildiragi',
    description: '60+ referal + qizil chipta kerak',
    ticketImage: ticketRedImg,
    ticketName: 'Qizil chipta',
    items: RED_ITEMS,
    gradient: 'linear-gradient(135deg, hsl(0 70% 50%), hsl(350 65% 40%))',
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
      <div className="w-full max-w-sm mx-4 rounded-3xl p-5 relative" style={{
        background: 'linear-gradient(180deg, hsl(30 25% 98%) 0%, hsl(25 20% 93%) 100%)',
        boxShadow: '0 20px 60px hsla(0 0% 0% / 0.4)',
      }}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ background: 'hsl(20 15% 90%)' }}>✕</button>

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
            {/* Pointer */}
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
                      className="absolute text-white font-bold flex flex-col items-center gap-0.5"
                      style={{
                        left: `${50 + 30 * Math.sin((midAngle * Math.PI) / 180)}%`,
                        top: `${50 - 30 * Math.cos((midAngle * Math.PI) / 180)}%`,
                        transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                        fontSize: '9px',
                        textShadow: '0 1px 3px hsla(0 0% 0% / 0.5)',
                      }}
                    >
                      <span className="text-base drop-shadow-md">{item.emoji}</span>
                      <span className="whitespace-nowrap">{item.label.replace(item.emoji, '').trim()}</span>
                    </div>
                  </div>
                );
              })}
              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(180deg, hsl(30 30% 98%) 0%, hsl(25 20% 88%) 100%)',
                  boxShadow: '0 2px 8px hsla(0 0% 0% / 0.2)',
                }}>
                  <img src={config.ticketImage} alt="" className="w-7 h-7 object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spin button */}
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

        {/* Result */}
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

// ── Ticket Info Modal ──
function TicketInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'hsla(0 0% 0% / 0.6)' }}>
      <div className="w-full max-w-md rounded-t-3xl p-5 pb-8 animate-slide-up" style={{
        background: 'linear-gradient(180deg, hsl(30 25% 98%) 0%, hsl(25 20% 93%) 100%)',
      }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-card-foreground">🎫 Chipta olish</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: 'hsl(20 15% 90%)' }}>✕</button>
        </div>

        <div className="space-y-3">
          {/* Yellow */}
          <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'hsl(45 80% 95%)', border: '1.5px solid hsl(45 70% 80%)' }}>
            <img src={ticketYellowImg} alt="" className="w-12 h-12 object-contain flex-shrink-0" />
            <div>
              <p className="font-bold text-sm" style={{ color: 'hsl(38 85% 40%)' }}>Sariq chipta</p>
              <p className="text-xs text-muted-foreground mt-0.5">Har 2 soatda 15 ta reklama ko'ring va 1 ta sariq chipta oling. Meva g'ildiragi uchun.</p>
            </div>
          </div>

          {/* Green */}
          <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'hsl(145 40% 95%)', border: '1.5px solid hsl(145 35% 80%)' }}>
            <img src={ticketGreenImg} alt="" className="w-12 h-12 object-contain flex-shrink-0" />
            <div>
              <p className="font-bold text-sm" style={{ color: 'hsl(145 50% 35%)' }}>Yashil chipta</p>
              <p className="text-xs text-muted-foreground mt-0.5">Har 7 ta referalga 1 ta yashil chipta beriladi. Tanga g'ildiragi uchun.</p>
            </div>
          </div>

          {/* Red */}
          <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'hsl(0 40% 95%)', border: '1.5px solid hsl(0 35% 82%)' }}>
            <img src={ticketRedImg} alt="" className="w-12 h-12 object-contain flex-shrink-0" />
            <div>
              <p className="font-bold text-sm" style={{ color: 'hsl(0 60% 42%)' }}>Qizil chipta</p>
              <p className="text-xs text-muted-foreground mt-0.5">Yashil g'ildirakdan yutib oling! Jackpot uchun 60+ referal kerak.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Lottery Page ──
export default function Lottery() {
  const { userData, triggerAd, refreshUserData } = useGarden();
  const [openWheel, setOpenWheel] = useState<WheelTier | null>(null);
  const [showTicketInfo, setShowTicketInfo] = useState(false);

  // Compute ticket counts from userData (we read from DB)
  const [localTickets, setLocalTickets] = useState<{ yellow: number; green: number; red: number } | null>(null);

  // Load tickets from DB
  const tickets = localTickets ?? { yellow: 0, green: 0, red: 0 };

  // Load tickets on mount
  const loadTickets = useCallback(async () => {
    if (!userData.telegramId) return;
    const { data } = await supabase
      .from('users')
      .select('tickets_yellow, tickets_green, tickets_red, lottery_ads_watched, lottery_ads_reset_at')
      .eq('telegram_id', userData.telegramId)
      .maybeSingle();
    if (data) {
      // Auto-calculate green tickets from referral count
      const totalReferrals = userData.referral.referredUsers.length;
      const earnedGreen = Math.floor(totalReferrals / 7);
      const usedGreen = earnedGreen - (data as any).tickets_green;

      setLocalTickets({
        yellow: (data as any).tickets_yellow ?? 0,
        green: (data as any).tickets_green ?? 0,
        red: (data as any).tickets_red ?? 0,
      });

      // Sync green tickets if referrals increased
      if (earnedGreen > ((data as any).tickets_green ?? 0) + usedGreen) {
        // tickets_green tracks available, so we just sync
      }
    }
  }, [userData.telegramId, userData.referral.referredUsers.length]);

  // Load on mount
  useState(() => { loadTickets(); });

  const referralCount = userData.referral.referredUsers.length;

  // Earn yellow ticket via ads
  const handleEarnYellowTicket = useCallback(() => {
    if (!userData.telegramId) return;

    // Check 2hr cooldown
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

      // Reset if 2hrs passed
      if (now - resetAt >= twoHours) {
        adsWatched = 0;
      }

      if (adsWatched >= 15) {
        alert('Chipta olish uchun 2 soat kutish kerak!');
        return;
      }

      // Watch 1 ad
      triggerAd(async () => {
        const newAdsWatched = adsWatched + 1;
        const updates: any = {
          lottery_ads_watched: newAdsWatched,
        };

        // If first ad in cycle, set reset time
        if (adsWatched === 0) {
          updates.lottery_ads_reset_at = new Date().toISOString();
        }

        // If reached 15, award ticket
        if (newAdsWatched >= 15) {
          updates.tickets_yellow = (tickets.yellow || 0) + 1;
          setLocalTickets(prev => prev ? { ...prev, yellow: prev.yellow + 1 } : { yellow: 1, green: 0, red: 0 });
        }

        await supabase
          .from('users')
          .update(updates)
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

    // Deduct ticket
    const ticketKey = tier === 'yellow' ? 'tickets_yellow' : tier === 'green' ? 'tickets_green' : 'tickets_red';

    const updates: Record<string, any> = {
      [ticketKey]: Math.max(0, (tickets[tier] || 0) - 1),
    };

    // Apply reward
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
      // Referral bonus just adds coins equivalent
      const { data: user } = await supabase.from('users').select('coins').eq('telegram_id', userData.telegramId).maybeSingle();
      if (user) {
        updates.coins = (user.coins ?? 0) + item.value * 10; // each referral unit = 10 coins
      }
    }

    await supabase.from('users').update(updates).eq('telegram_id', userData.telegramId);

    // Update local tickets
    setLocalTickets(prev => {
      if (!prev) return prev;
      const newTickets = { ...prev };
      newTickets[tier] = Math.max(0, newTickets[tier] - 1);
      if (item.type === 'red_ticket') newTickets.red += 1;
      return newTickets;
    });

    await refreshUserData();
  }, [userData.telegramId, tickets, refreshUserData]);

  const getWheelTickets = (tier: WheelTier) => {
    return tickets[tier] || 0;
  };

  return (
    <div className="px-4 py-3 pb-28" style={{ background: 'linear-gradient(180deg, hsl(20 30% 96%) 0%, hsl(15 20% 93%) 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">Lotereya</h1>
        <CoinBalance />
      </div>

      {/* Ticket summary */}
      <div className="flex gap-2 mb-5">
        {WHEEL_CONFIGS.map(cfg => (
          <div key={cfg.id} className="flex-1 flex items-center gap-1.5 p-2 rounded-xl" style={{
            background: 'hsl(30 20% 96%)',
            border: '1.5px solid hsl(25 15% 88%)',
          }}>
            <img src={cfg.ticketImage} alt="" className="w-7 h-7 object-contain" />
            <span className="text-sm font-bold text-card-foreground">{getWheelTickets(cfg.id)}</span>
          </div>
        ))}
      </div>

      {/* 3 Wheel Cards */}
      <div className="space-y-3">
        {WHEEL_CONFIGS.map(cfg => {
          const t = getWheelTickets(cfg.id);
          const locked = cfg.id === 'red' && referralCount < 60;
          return (
            <button
              key={cfg.id}
              onClick={() => !locked && setOpenWheel(cfg.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-transform active:scale-[0.98]"
              style={{
                background: locked
                  ? 'hsl(20 10% 92%)'
                  : 'linear-gradient(135deg, hsl(30 25% 98%) 0%, hsl(25 20% 95%) 100%)',
                border: `2px solid ${locked ? 'hsl(20 10% 85%)' : 'hsl(25 20% 88%)'}`,
                boxShadow: locked ? 'none' : '0 4px 16px hsla(0 0% 0% / 0.06)',
                opacity: locked ? 0.6 : 1,
              }}
            >
              {/* Wheel mini preview */}
              <div className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center relative overflow-hidden" style={{
                background: cfg.gradient,
                boxShadow: `0 0 0 3px hsl(25 20% 85%), 0 4px 12px hsla(0 0% 0% / 0.15)`,
              }}>
                {locked ? (
                  <span className="text-2xl">🔒</span>
                ) : (
                  <img src={cfg.ticketImage} alt="" className="w-10 h-10 object-contain" />
                )}
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
                {locked && (
                  <p className="text-xs font-bold mt-1" style={{ color: 'hsl(0 75% 50%)' }}>
                    {referralCount}/60 referal
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

        <button
          onClick={() => setShowTicketInfo(true)}
          className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          style={{
            background: 'hsl(20 15% 90%)',
            color: 'hsl(25 15% 45%)',
          }}
        >
          🎫 Chipta qanday olish?
        </button>
      </div>

      {/* Guide */}
      <div className="card-flat mt-5 p-4">
        <h3 className="font-bold text-card-foreground text-sm mb-2">💡 Qanday ishlaydi?</h3>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>• 🟡 Sariq chipta — 2 soatda 15 reklama ko'rib oling</p>
          <p>• 🟢 Yashil chipta — har 7 referalga 1 ta</p>
          <p>• 🔴 Qizil chipta — yashil g'ildirakdan yuting (60+ referal)</p>
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

      {/* Ticket Info Modal */}
      {showTicketInfo && <TicketInfoModal onClose={() => setShowTicketInfo(false)} />}
    </div>
  );
}
