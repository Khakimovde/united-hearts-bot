import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGarden } from '@/contexts/GardenContext';
import { TreeCard } from '@/components/TreeCard';
import { FruitSellingCard } from '@/components/FruitSellingCard';
import { CoinBalance } from '@/components/CoinBalance';
import { TREE_CONFIGS } from '@/lib/gameConfig';
import type { TreeType } from '@/lib/types';
import { ShoppingBag, Sprout, AlertTriangle } from 'lucide-react';

const TREE_ORDER: TreeType[] = ['apple', 'pear', 'grape', 'fig'];

type MarketTab = 'fruits' | 'saplings';

export default function Market() {
  const { userData, buySapling, claimFreeSapling, sellFruit, hasActiveTree } = useGarden();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MarketTab>('fruits');

  const prevCount = useRef(userData.trees.length);
  useEffect(() => {
    if (userData.trees.length > prevCount.current) {
      prevCount.current = userData.trees.length;
      navigate('/');
    } else {
      prevCount.current = userData.trees.length;
    }
  }, [userData.trees.length, navigate]);

  const handleBuy = (type: TreeType) => {
    if (hasActiveTree) return;
    if (type === 'apple' && !userData.hasClaimedFreeSapling) {
      claimFreeSapling();
      return;
    }
    buySapling(type);
  };

  const totalFruits = TREE_ORDER.reduce((sum, t) => sum + userData.fruits[t], 0);

  return (
    <div className="px-4 py-3 pb-28" style={{ background: 'linear-gradient(180deg, hsl(20 30% 96%) 0%, hsl(15 20% 93%) 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">🏪 Bozor</h1>
        <CoinBalance />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5 p-1.5 rounded-2xl" style={{ background: 'hsl(20 15% 90%)' }}>
        <button
          onClick={() => setActiveTab('fruits')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all
            ${activeTab === 'fruits'
              ? 'text-primary-foreground'
              : 'text-muted-foreground'
            }
          `}
          style={activeTab === 'fruits' ? {
            background: 'linear-gradient(180deg, hsl(0 80% 58%) 0%, hsl(0 75% 48%) 100%)',
            boxShadow: '0 4px 12px hsl(0 70% 45% / 0.3)',
            borderBottom: '3px solid hsl(0 60% 35%)',
          } : {}}
        >
          <ShoppingBag className="w-4 h-4" />
          Meva sotish
          {totalFruits > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full font-bold"
              style={{ background: activeTab === 'fruits' ? 'hsl(0 0% 100% / 0.25)' : 'hsl(0 75% 50%)', color: 'white' }}
            >
              {totalFruits}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('saplings')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all
            ${activeTab === 'saplings'
              ? 'text-primary-foreground'
              : 'text-muted-foreground'
            }
          `}
          style={activeTab === 'saplings' ? {
            background: 'linear-gradient(180deg, hsl(0 80% 58%) 0%, hsl(0 75% 48%) 100%)',
            boxShadow: '0 4px 12px hsl(0 70% 45% / 0.3)',
            borderBottom: '3px solid hsl(0 60% 35%)',
          } : {}}
        >
          <Sprout className="w-4 h-4" />
          Ko'chat olish
        </button>
      </div>

      {/* Fruits Tab */}
      {activeTab === 'fruits' && (
        <div className="space-y-2.5">
          {TREE_ORDER.map((type) => {
            const config = TREE_CONFIGS[type];
            const count = userData.fruits[type];
            return (
              <FruitSellingCard
                key={type}
                type={type}
                config={config}
                count={count}
                onSell={(amount) => sellFruit(type, amount)}
              />
            );
          })}

          {totalFruits === 0 && (
            <div className="card-cartoon p-5 text-center mt-4" style={{ borderStyle: 'dashed' }}>
              <p className="text-sm text-muted-foreground">
                💡 Daraxtlarni o'stiring va meva yig'ing, keyin bu yerda soting!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Saplings Tab */}
      {activeTab === 'saplings' && (
        <div className="space-y-2.5">
          {/* Warning if active tree exists */}
          {hasActiveTree && (
            <div className="card-cartoon p-4 mb-2 flex items-center gap-3" style={{ borderColor: 'hsl(38 80% 52%)', background: 'hsl(38 80% 52% / 0.08)' }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(38 80% 52%)' }} />
              <p className="text-xs text-card-foreground">
                Sizda hozir faol daraxt bor. Yangi ko'chat olish uchun avval mevani yig'ib oling!
              </p>
            </div>
          )}

          {TREE_ORDER.map((type) => {
            const config = TREE_CONFIGS[type];
            const isFirstFree = type === 'apple' && !userData.hasClaimedFreeSapling;
            const canAfford = !hasActiveTree && (isFirstFree || userData.coins >= config.saplingCost);

            return (
              <TreeCard
                key={type}
                config={config}
                canAfford={canAfford}
                onBuy={() => handleBuy(type)}
                isFirstFree={isFirstFree && !hasActiveTree}
              />
            );
          })}
        </div>
      )}

      {/* Earnings guide */}
      <div className="card-cartoon mt-8 p-5">
        <h3 className="font-bold text-card-foreground text-sm mb-3">
          💡 Daromad yo'riqnomasi
        </h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• Bir vaqtda faqat 1 ta daraxt o'stirish mumkin</p>
          <p>• Daraxtlarni o'stiring va meva yig'ing</p>
          <p>• Yig'ilgan mevalarni bozorda tangaga soting</p>
          <p>• Qimmatroq daraxtlar — ko'proq daromad</p>
        </div>
      </div>
    </div>
  );
}