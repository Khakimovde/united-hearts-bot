import { Coins } from 'lucide-react';
import { useGarden } from '@/contexts/GardenContext';

export function CoinBalance() {
  const { userData } = useGarden();

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{ background: 'hsl(38 80% 52% / 0.15)', border: '2px solid hsl(38 80% 52% / 0.25)' }}
    >
      <Coins className="w-4 h-4 text-accent" />
      <span className="text-sm font-bold text-foreground tabular-nums">
        {userData.coins}
      </span>
    </div>
  );
}
