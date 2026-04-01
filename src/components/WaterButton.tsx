import { Droplets } from 'lucide-react';
import { useGarden } from '@/contexts/GardenContext';

export function WaterButton() {
  const { canWater, waterTree, currentTreeStatus } = useGarden();

  if (
    !currentTreeStatus ||
    currentTreeStatus === 'harvested' ||
    currentTreeStatus === 'fruiting' ||
    currentTreeStatus === 'growing'
  ) {
    return null;
  }

  return (
    <button
      onClick={waterTree}
      disabled={!canWater}
      className={`
        w-full py-4 flex items-center justify-center gap-3
        transition-all duration-300
        ${canWater
          ? 'btn-cartoon'
          : 'bg-muted text-muted-foreground cursor-not-allowed rounded-2xl font-semibold text-base'
        }
      `}
    >
      <Droplets className="w-5 h-5" />
      {currentTreeStatus === 'needs_first_water'
        ? '🌱 Birinchi suv berish'
        : '💧 Suv berish vaqti keldi!'}
    </button>
  );
}
