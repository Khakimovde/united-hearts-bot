import type { TreeStatus } from '@/lib/types';

interface GrowthProgressProps {
  completed: number;
  total: number;
  status: TreeStatus;
}

export function GrowthProgress({ completed, total, status }: GrowthProgressProps) {
  const gapClass = total > 16 ? 'gap-[2px]' : 'gap-1';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">O'sish jarayoni</span>
        <span className="text-sm font-semibold text-foreground">
          {completed}/{total}
        </span>
      </div>

      <div className={`flex ${gapClass}`}>
        {Array.from({ length: total }).map((_, i) => {
          const isFilled = i < completed;
          const isCurrent = i === completed;
          const isNeedsWater = status === 'needs_water' || status === 'needs_first_water';

          return (
            <div
              key={i}
              className={`
                h-2 flex-1 rounded-full transition-all duration-500
                ${isFilled ? 'bg-primary' : ''}
                ${isCurrent && isNeedsWater ? 'bg-accent animate-soft-pulse' : ''}
                ${!isFilled && !(isCurrent && isNeedsWater) ? 'bg-border' : ''}
              `}
            />
          );
        })}
      </div>

      {status === 'needs_water' && (
        <p className="text-sm text-accent font-medium mt-2.5 text-center animate-soft-pulse">
          Daraxt o'sishi to'xtadi. Suv bering!
        </p>
      )}

      {status === 'fruiting' && (
        <p className="text-sm text-primary font-medium mt-2.5 text-center">
          🎉 Meva pishdi! Yig'ishga tayyor.
        </p>
      )}
    </div>
  );
}
