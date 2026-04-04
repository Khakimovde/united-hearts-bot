import type { TreeConfig } from '@/lib/types';
import { Clock, Droplets, Coins } from 'lucide-react';

import appleTree from '@/assets/apple-tree.png';
import pearTree from '@/assets/pear-tree.png';
import grapeTree from '@/assets/grape-tree.png';
import figTree from '@/assets/fig-tree.png';

const TREE_IMAGES: Record<string, string> = {
  apple: appleTree,
  pear: pearTree,
  grape: grapeTree,
  fig: figTree,
};

interface TreeCardProps {
  config: TreeConfig;
  canAfford: boolean;
  onBuy: () => void;
  isFirstFree?: boolean;
}

export function TreeCard({ config, canAfford, onBuy, isFirstFree }: TreeCardProps) {
  return (
    <div className="card-cartoon p-4 flex items-center gap-4">
      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
        <img
          src={TREE_IMAGES[config.type]}
          alt={config.name}
          className="w-14 h-14 object-contain"
          draggable={false}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-card-foreground text-sm">{config.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{config.description}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{config.growthHours} soat</span>
          <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{config.wateringsRequired}x</span>
          <span className="flex items-center gap-1">{config.emoji} {config.fruitCount} ta</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {isFirstFree ? (
          <span className="text-xs font-bold" style={{ color: 'hsl(145 50% 40%)' }}>Bepul</span>
        ) : (
          <div className="flex items-center gap-1 text-sm font-bold text-accent">
            <Coins className="w-3.5 h-3.5" />{config.saplingCost}
          </div>
        )}
        <button
          onClick={onBuy}
          disabled={!canAfford && !isFirstFree}
          className={`
            px-4 py-1.5 text-xs transition-all duration-200
            ${canAfford || isFirstFree
              ? 'btn-cartoon'
              : 'bg-muted text-muted-foreground cursor-not-allowed rounded-xl font-bold'
            }
          `}
        >
          {isFirstFree ? 'Olish' : canAfford ? 'Sotib olish' : 'Yetarli emas'}
        </button>
      </div>
    </div>
  );
}
