import { Coins } from 'lucide-react';
import type { TreeType, TreeConfig } from '@/lib/types';

import appleTree from '@/assets/apple-tree.png';
import pearTree from '@/assets/pear-tree.png';
import grapeTree from '@/assets/grape-tree.png';
import figTree from '@/assets/fig-tree.png';

const TREE_IMAGES: Record<TreeType, string> = {
  apple: appleTree,
  pear: pearTree,
  grape: grapeTree,
  fig: figTree,
};

interface FruitSellingCardProps {
  type: TreeType;
  config: TreeConfig;
  count: number;
  onSell: (amount: number) => void;
}

export function FruitSellingCard({ type, config, count, onSell }: FruitSellingCardProps) {
  const isDisabled = count === 0;

  return (
    <div className={`card-cartoon p-4 flex items-center gap-3 transition-opacity duration-200 ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
        <img
          src={TREE_IMAGES[type]}
          alt={config.name}
          className={`w-10 h-10 object-contain ${isDisabled ? 'grayscale' : ''}`}
          draggable={false}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-card-foreground text-sm">
          {config.emoji} {config.name.replace(' daraxti', '').replace(' tokasi', '')}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {count} ta meva • {config.fruitValue} tanga/dona
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className={`flex items-center gap-1 text-xs font-bold ${isDisabled ? 'text-muted-foreground' : 'text-accent'}`}>
          <Coins className="w-3 h-3" />{count * config.fruitValue}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => onSell(1)}
            disabled={count < 1}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all
              ${count >= 1 ? 'btn-cartoon' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
          >
            1 ta
          </button>
          <button
            onClick={() => onSell(count)}
            disabled={count === 0}
            className={`px-3 py-1.5 text-xs transition-all
              ${count > 0 ? 'btn-cartoon' : 'bg-muted text-muted-foreground cursor-not-allowed rounded-xl font-bold'}`}
          >
            Hammasi
          </button>
        </div>
      </div>
    </div>
  );
}
