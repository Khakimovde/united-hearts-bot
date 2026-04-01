import type { Tree, TreeStatus } from '@/lib/types';
import { TREE_CONFIGS } from '@/lib/gameConfig';

import appleTree from '@/assets/apple-tree.png';
import pearTree from '@/assets/pear-tree.png';
import grapeTree from '@/assets/grape-tree.png';
import figTree from '@/assets/fig-tree.png';
import saplingImg from '@/assets/sapling.png';
import gardenBg from '@/assets/garden-bg.jpg';
import groundImg from '@/assets/ground.png';

const TREE_IMAGES: Record<string, string> = {
  apple: appleTree,
  pear: pearTree,
  grape: grapeTree,
  fig: figTree,
};

interface TreeViewProps {
  tree: Tree;
  status: TreeStatus;
  growthPercent: number;
}

export function TreeView({ tree, status, growthPercent }: TreeViewProps) {
  const treeImage = TREE_IMAGES[tree.type];
  const config = TREE_CONFIGS[tree.type];

  const isSapling = growthPercent < 25;
  const image = isSapling ? saplingImg : treeImage;

  // Scale: sapling 0.8-1.0, tree 0.85-1.15
  const scale = isSapling
    ? 0.8 + (growthPercent / 25) * 0.2
    : 0.85 + ((growthPercent - 25) / 75) * 0.3;

  const recentlyWatered =
    tree.lastWateredAt != null && Date.now() - tree.lastWateredAt < 60000;

  const isPaused = status === 'needs_water';
  const isFruiting = status === 'fruiting';
  const isHarvested = status === 'harvested';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end overflow-hidden">
      {/* Sky + landscape background */}
      <img
        src={gardenBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Rain when watered */}
      {recentlyWatered && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 rounded-full animate-rain"
              style={{
                left: `${5 + Math.random() * 90}%`,
                height: `${12 + Math.random() * 16}px`,
                animationDelay: `${Math.random() * 0.8}s`,
                animationDuration: `${0.5 + Math.random() * 0.4}s`,
                backgroundColor: 'hsl(200 70% 70% / 0.6)',
              }}
            />
          ))}
        </div>
      )}

      {/* Tree — positioned so base aligns with grass top */}
      <div
        className={`
          relative z-20 transition-all duration-1000 ease-out origin-bottom
          ${isPaused ? 'opacity-70' : 'opacity-100'}
          ${isFruiting ? 'animate-float' : ''}
        `}
        style={{
          transform: `scale(${scale})`,
          filter: isPaused
            ? 'saturate(0.5) brightness(0.85)'
            : `saturate(${0.8 + (growthPercent / 100) * 0.4})`,
          marginBottom: '15%',
        }}
      >
        <img
          src={image}
          alt={config.name}
          className={`
            h-auto object-contain select-none drop-shadow-lg
            ${isSapling ? 'w-52 max-h-[34vh]' : 'w-72 max-h-[48vh]'}
          `}
          draggable={false}
        />

        {/* Fruit ready badge */}
        {isFruiting && !isSapling && (
          <div className="absolute -top-2 -right-2 animate-fruit-appear">
            <span className="text-3xl drop-shadow-md">{config.emoji}</span>
          </div>
        )}
      </div>

      {/* Ground with grass */}
      <div className="absolute bottom-0 left-0 right-0 z-20" style={{ height: '20%' }}>
        <img
          src={groundImg}
          alt=""
          className="w-full h-full object-cover object-top"
          draggable={false}
        />
      </div>

      {/* Status badges */}
      {isPaused && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full text-xs font-medium animate-soft-pulse backdrop-blur-sm"
          style={{ background: 'hsl(0 70% 45% / 0.85)', color: 'hsl(0 0% 100%)' }}
        >
          💤 Suv kerak
        </div>
      )}

      {isHarvested && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm"
          style={{ background: 'hsl(145 40% 25% / 0.75)', color: 'hsl(100 50% 92%)' }}
        >
          ✓ Yig'ildi
        </div>
      )}
    </div>
  );
}
