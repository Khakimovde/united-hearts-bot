import { useState, useRef, useCallback } from 'react';
import { useGarden } from '@/contexts/GardenContext';
import { CoinBalance } from '@/components/CoinBalance';
import { TREE_CONFIGS } from '@/lib/gameConfig';
import type { TreeType } from '@/lib/types';

type WheelType = 'fruits' | 'coins' | 'jackpot';

interface WheelItem {
  label: string;
  emoji: string;
  color: string;
  value: number;
  type: 'fruit' | 'coin' | 'referral';
  fruitType?: TreeType;
}

const FRUIT_WHEEL: WheelItem[] = [
  { label: 'Olma 5', emoji: '🍎', color: 'hsl(0 70% 55%)', value: 5, type: 'fruit', fruitType: 'apple' },
  { label: 'Uzum 3', emoji: '🍇', color: 'hsl(270 50% 50%)', value: 3, type: 'fruit', fruitType: 'grape' },
  { label: 'Nok 4', emoji: '🍐', color: 'hsl(80 50% 45%)', value: 4, type: 'fruit', fruitType: 'pear' },
  { label: 'Olma 2', emoji: '🍎', color: 'hsl(0 60% 60%)', value: 2, type: 'fruit', fruitType: 'apple' },
  { label: 'Anjir 3', emoji: '🫐', color: 'hsl(240 40% 50%)', value: 3, type: 'fruit', fruitType: 'fig' },
  { label: 'Uzum 5', emoji: '🍇', color: 'hsl(280 55% 55%)', value: 5, type: 'fruit', fruitType: 'grape' },
  { label: 'Nok 2', emoji: '🍐', color: 'hsl(90 45% 50%)', value: 2, type: 'fruit', fruitType: 'pear' },
  { label: 'Olma 8', emoji: '🍎', color: 'hsl(5 75% 50%)', value: 8, type: 'fruit', fruitType: 'apple' },
  { label: 'Anjir 2', emoji: '🫐', color: 'hsl(230 45% 55%)', value: 2, type: 'fruit', fruitType: 'fig' },
  { label: 'Uzum 7', emoji: '🍇', color: 'hsl(265 50% 48%)', value: 7, type: 'fruit', fruitType: 'grape' },
];

const COIN_WHEEL: WheelItem[] = [
  { label: '+2 tanga', emoji: '🪙', color: 'hsl(45 85% 50%)', value: 2, type: 'coin' },
  { label: '+5 tanga', emoji: '💰', color: 'hsl(38 80% 48%)', value: 5, type: 'coin' },
  { label: '+2 ref', emoji: '👥', color: 'hsl(200 60% 50%)', value: 2, type: 'referral' },
  { label: '+3 tanga', emoji: '🪙', color: 'hsl(50 80% 52%)', value: 3, type: 'coin' },
  { label: '+5 ref', emoji: '👥', color: 'hsl(210 65% 48%)', value: 5, type: 'referral' },
  { label: '+10 tanga', emoji: '💰', color: 'hsl(35 85% 45%)', value: 10, type: 'coin' },
  { label: '+1 ref', emoji: '👥', color: 'hsl(195 55% 52%)', value: 1, type: 'referral' },
  { label: '+8 tanga', emoji: '💰', color: 'hsl(42 78% 50%)', value: 8, type: 'coin' },
  { label: '+3 ref', emoji: '👥', color: 'hsl(205 60% 50%)', value: 3, type: 'referral' },
  { label: '+15 tanga', emoji: '💎', color: 'hsl(30 90% 45%)', value: 15, type: 'coin' },
];

const JACKPOT_WHEEL: WheelItem[] = [
  { label: '+50 tanga', emoji: '💎', color: 'hsl(280 70% 50%)', value: 50, type: 'coin' },
  { label: 'Olma 20', emoji: '🍎', color: 'hsl(0 75% 50%)', value: 20, type: 'fruit', fruitType: 'apple' },
  { label: '+100 tanga', emoji: '👑', color: 'hsl(45 95% 50%)', value: 100, type: 'coin' },
  { label: 'Uzum 15', emoji: '🍇', color: 'hsl(270 55% 50%)', value: 15, type: 'fruit', fruitType: 'grape' },
  { label: '+25 tanga', emoji: '💰', color: 'hsl(38 80% 50%)', value: 25, type: 'coin' },
  { label: 'Anjir 10', emoji: '🫐', color: 'hsl(230 50% 50%)', value: 10, type: 'fruit', fruitType: 'fig' },
  { label: '+200 tanga', emoji: '🏆', color: 'hsl(50 100% 48%)', value: 200, type: 'coin' },
  { label: 'Nok 12', emoji: '🍐', color: 'hsl(85 50% 45%)', value: 12, type: 'fruit', fruitType: 'pear' },
  { label: '+75 tanga', emoji: '💎', color: 'hsl(290 65% 48%)', value: 75, type: 'coin' },
  { label: '+500 tanga', emoji: '🌟', color: 'hsl(42 100% 50%)', value: 500, type: 'coin' },
];

const WHEEL_TABS: { id: WheelType; label: string; emoji: string; items: WheelItem[]; cost: number; color: string }[] = [
  { id: 'fruits', label: 'Meva', emoji: '🍎', items: FRUIT_WHEEL, cost: 20, color: 'hsl(0 70% 50%)' },
  { id: 'coins', label: 'Tanga', emoji: '🪙', items: COIN_WHEEL, cost: 50, color: 'hsl(45 85% 50%)' },
  { id: 'jackpot', label: 'Jackpot', emoji: '🏆', items: JACKPOT_WHEEL, cost: 150, color: 'hsl(280 70% 50%)' },
];

function SpinWheel({ items, spinning, rotation, onSpin, cost, canAfford, disabled }: {
  items: WheelItem[];
  spinning: boolean;
  rotation: number;
  onSpin: () => void;
  cost: number;
  canAfford: boolean;
  disabled: boolean;
}) {
  const segmentAngle = 360 / items.length;

  return (
    <div className="flex flex-col items-center">
      {/* Wheel container */}
      <div className="relative w-72 h-72 mb-4">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
          <div className="w-0 h-0" style={{
            borderLeft: '14px solid transparent',
            borderRight: '14px solid transparent',
            borderTop: '24px solid hsl(0 75% 50%)',
            filter: 'drop-shadow(0 3px 6px hsl(0 0% 0% / 0.3))',
          }} />
        </div>

        {/* Wheel */}
        <div
          className="w-full h-full rounded-full relative overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            boxShadow: '0 0 0 6px hsl(25 20% 85%), 0 0 0 10px hsl(0 75% 50%), 0 8px 32px hsl(0 0% 0% / 0.3)',
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
                  background: `linear-gradient(${startAngle + 90}deg, ${item.color}, ${item.color}dd)`,
                }}
              >
                <div
                  className="absolute text-white font-bold text-xs flex flex-col items-center"
                  style={{
                    left: `${50 + 32 * Math.sin((midAngle * Math.PI) / 180)}%`,
                    top: `${50 - 32 * Math.cos((midAngle * Math.PI) / 180)}%`,
                    transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                  }}
                >
                  <span className="text-lg drop-shadow">{item.emoji}</span>
                </div>
              </div>
            );
          })}

          {/* Center circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, hsl(30 30% 98%) 0%, hsl(25 20% 90%) 100%)',
                boxShadow: '0 2px 8px hsl(0 0% 0% / 0.2), inset 0 1px 2px hsl(0 0% 100% / 0.5)',
              }}
            >
              <span className="text-xl">🎰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={onSpin}
        disabled={disabled || spinning || !canAfford}
        className="btn-cartoon px-8 py-3.5 text-sm flex items-center gap-2 disabled:opacity-50"
      >
        {spinning ? '⏳ Aylanmoqda...' : `🎰 Aylantirish (${cost} tanga)`}
      </button>
      {!canAfford && !spinning && (
        <p className="text-xs mt-2" style={{ color: 'hsl(0 75% 50%)' }}>Yetarli tanga yo'q</p>
      )}
    </div>
  );
}

export default function Lottery() {
  const { userData, triggerAd } = useGarden();
  const [activeWheel, setActiveWheel] = useState<WheelType>('fruits');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const spinningRef = useRef(false);

  const currentTab = WHEEL_TABS.find(t => t.id === activeWheel)!;
  const canAfford = userData.coins >= currentTab.cost;

  const handleSpin = useCallback(() => {
    if (spinningRef.current || !canAfford) return;
    spinningRef.current = true;

    triggerAd(() => {
      setSpinning(true);
      setShowResult(false);
      setResult(null);

      const items = currentTab.items;
      const winIndex = Math.floor(Math.random() * items.length);
      const segmentAngle = 360 / items.length;

      // Calculate rotation: multiple full spins + land on winning segment
      const extraSpins = 5 + Math.floor(Math.random() * 3);
      const targetAngle = 360 - (winIndex * segmentAngle + segmentAngle / 2);
      const totalRotation = extraSpins * 360 + targetAngle;

      setRotation(prev => prev + totalRotation);

      setTimeout(() => {
        setSpinning(false);
        setResult(items[winIndex]);
        setShowResult(true);
        spinningRef.current = false;

        // TODO: Actually apply the reward via supabase
      }, 4200);
    }, 1);
  }, [canAfford, currentTab, triggerAd]);

  return (
    <div className="px-4 py-3 pb-28" style={{ background: 'linear-gradient(180deg, hsl(20 30% 96%) 0%, hsl(15 20% 93%) 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">🎰 Lotereya</h1>
        <CoinBalance />
      </div>

      {/* Wheel type selector */}
      <div className="flex gap-2 mb-5 p-1.5 rounded-2xl" style={{ background: 'hsl(20 15% 90%)' }}>
        {WHEEL_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { if (!spinning) setActiveWheel(tab.id); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeWheel === tab.id ? 'text-white' : 'text-muted-foreground'
            }`}
            style={activeWheel === tab.id ? {
              background: `linear-gradient(180deg, ${tab.color}, ${tab.color}cc)`,
              boxShadow: `0 4px 12px ${tab.color}50`,
              borderBottom: `3px solid ${tab.color}88`,
            } : {}}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info card */}
      <div className="card-flat p-3 mb-5 flex items-center gap-3">
        <span className="text-2xl">{currentTab.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-card-foreground">{currentTab.label} g'ildiragi</p>
          <p className="text-xs text-muted-foreground">Narxi: {currentTab.cost} tanga • 1 ta reklama</p>
        </div>
      </div>

      {/* Wheel */}
      <SpinWheel
        items={currentTab.items}
        spinning={spinning}
        rotation={rotation}
        onSpin={handleSpin}
        cost={currentTab.cost}
        canAfford={canAfford}
        disabled={false}
      />

      {/* Result */}
      {showResult && result && (
        <div className="card-flat p-4 mt-5 text-center animate-scale-in">
          <p className="text-3xl mb-2">{result.emoji}</p>
          <p className="font-bold text-card-foreground text-base">{result.label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {result.type === 'fruit' ? "Mevalaringizga qo'shildi!" :
             result.type === 'coin' ? "Tangalaringizga qo'shildi!" :
             "Referallaringizga qo'shildi!"}
          </p>
        </div>
      )}

      {/* Guide */}
      <div className="card-flat mt-6 p-4">
        <h3 className="font-bold text-card-foreground text-sm mb-2">💡 Qanday ishlaydi?</h3>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>• G'ildirakni aylantirish uchun tanga va reklama kerak</p>
          <p>• 🍎 Meva g'ildiragi — mevalar yutib olasiz</p>
          <p>• 🪙 Tanga g'ildiragi — tanga va referal bonuslari</p>
          <p>• 🏆 Jackpot — katta sovrinlar!</p>
        </div>
      </div>
    </div>
  );
}
