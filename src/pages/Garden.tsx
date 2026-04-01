import { useGarden } from '@/contexts/GardenContext';
import { TreeView } from '@/components/TreeView';
import { GrowthProgress } from '@/components/GrowthProgress';
import { WaterButton } from '@/components/WaterButton';
import { CountdownTimer } from '@/components/CountdownTimer';
import { CoinBalance } from '@/components/CoinBalance';
import { EmptyGarden } from '@/components/EmptyGarden';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export default function Garden() {
  const {
    currentTree,
    currentTreeStatus,
    currentTreeConfig,
    growthPercent,
    timeUntilNextWater,
    harvestTree,
    claimFreeSapling,
    selectTree,
    userData,
  } = useGarden();

  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/sounds/garden-birds.m4a');
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  if (!currentTree) {
    return <EmptyGarden />;
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 72px)', overflow: 'hidden' }}>
      {/* Header — floating over scene */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3">
        <div className="backdrop-blur-md rounded-xl px-3 py-1.5"
          style={{ background: 'hsl(0 0% 100% / 0.3)' }}
        >
          <h1 className="text-sm font-semibold" style={{ color: 'hsl(25 25% 12%)' }}>
            {currentTreeConfig?.emoji} {currentTreeConfig?.name}
          </h1>
        </div>
        <div className="backdrop-blur-md rounded-full"
          style={{ background: 'hsl(0 0% 100% / 0.3)' }}
        >
          <CoinBalance />
        </div>
      </div>

      {/* Tree scene — fills available space */}
      <div className="flex-1 relative">
        <TreeView
          tree={currentTree}
          status={currentTreeStatus!}
          growthPercent={growthPercent}
        />
      </div>

      {/* Controls panel — directly attached, no gap */}
      <div className="relative z-30 rounded-t-3xl bg-card border-t-2 border-border px-5 pt-4 pb-3 space-y-3"
        style={{ boxShadow: '0 -8px 30px hsl(0 0% 0% / 0.1)' }}
      >
        {/* Growth progress */}
        <GrowthProgress
          completed={currentTree.wateringsCompleted}
          total={currentTreeConfig!.wateringsRequired}
          status={currentTreeStatus!}
        />

        {/* Countdown */}
        {currentTreeStatus === 'growing' && (
          <CountdownTimer targetTime={timeUntilNextWater} />
        )}

        {/* Water button */}
        <WaterButton />

        {/* Harvest */}
        {currentTreeStatus === 'fruiting' && (
          <button
            onClick={harvestTree}
            className="btn-cartoon-secondary w-full py-3.5 flex items-center justify-center gap-3"
          >
            {currentTreeConfig?.emoji} Meva yig'ish
          </button>
        )}

        {/* Harvested state */}
        {currentTreeStatus === 'harvested' && (
          <div className="text-center py-3">
            <p className="text-base font-medium text-foreground mb-1">✓ Meva yig'ildi!</p>
            <p className="text-xs text-muted-foreground mb-3">Yangi ko'chat uchun bozorga boring</p>
            <button
              onClick={() => navigate('/market')}
              className="btn-cartoon px-6 py-2.5"
            >
              🛒 Bozorga o'tish
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
