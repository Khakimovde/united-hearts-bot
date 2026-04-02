import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { Tree, TreeType, TreeStatus, UserData, FruitInventory } from '@/lib/types';
import { TREE_CONFIGS, WATERING_INTERVAL_MS, AD_TASK_DAILY_MAX, AD_TASK_COIN_PER_AD, CHANNEL_TASKS } from '@/lib/gameConfig';
import { useTelegram } from '@/hooks/useTelegram';
import { useSupabaseUser, type DbUser, type DbTree } from '@/hooks/useSupabaseUser';
import { supabase } from '@/integrations/supabase/client';
import { getReferralLevel } from '@/lib/gameConfig';

function getUZTDateString(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const uzt = new Date(utc + 5 * 3600000);
  return `${uzt.getFullYear()}-${String(uzt.getMonth() + 1).padStart(2, '0')}-${String(uzt.getDate()).padStart(2, '0')}`;
}

// Convert DB user + trees to UserData format for compatibility
function dbToUserData(dbUser: DbUser, trees: DbTree[], referredUsers: string[]): UserData {
  return {
    telegramId: dbUser.telegram_id,
    username: dbUser.username,
    coins: dbUser.coins,
    trees: trees.map(t => ({
      id: t.id,
      type: t.tree_type as TreeType,
      plantedAt: new Date(t.planted_at).getTime(),
      wateringsCompleted: t.waterings_completed,
      lastWateredAt: t.last_watered_at ? new Date(t.last_watered_at).getTime() : null,
      harvested: t.harvested,
    })),
    currentTreeIndex: 0,
    hasClaimedFreeSapling: dbUser.has_claimed_free_sapling,
    fruits: {
      apple: dbUser.fruits_apple,
      pear: dbUser.fruits_pear,
      grape: dbUser.fruits_grape,
      fig: dbUser.fruits_fig,
    },
    stats: {
      totalTreesGrown: dbUser.total_trees_grown,
      totalFruitsHarvested: dbUser.total_fruits_harvested,
      totalAdsWatched: dbUser.total_ads_watched,
    },
    adTask: {
      lastResetDate: dbUser.ad_task_last_reset_date,
      adsWatched: dbUser.ad_task_ads_watched,
      totalAdsWatched: dbUser.ad_task_total_ads_watched,
    },
    referral: {
      referralCode: dbUser.referral_code,
      referredUsers,
      totalEarnings: dbUser.referral_earnings,
    },
  };
}

interface GardenContextType {
  userData: UserData;
  currentTree: Tree | null;
  currentTreeStatus: TreeStatus | null;
  currentTreeConfig: (typeof TREE_CONFIGS)[TreeType] | null;
  growthPercent: number;
  timeUntilNextWater: number;
  canWater: boolean;
  hasActiveTree: boolean;
  waterTree: () => void;
  harvestTree: () => void;
  buySapling: (type: TreeType) => boolean;
  claimFreeSapling: () => void;
  selectTree: (index: number) => void;
  showingAd: boolean;
  adCount: number;
  triggerAd: (callback: () => void, count?: number) => void;
  completeAd: () => void;
  watchAdTask: () => void;
  joinChannel: (channelId: string) => void;
  verifyChannel: (channelId: string) => void;
  shareReferral: () => void;
  sellFruit: (type: TreeType, amount: number) => void;
  loading: boolean;
}

const GardenContext = createContext<GardenContextType | null>(null);

export function useGarden() {
  const ctx = useContext(GardenContext);
  if (!ctx) throw new Error('useGarden must be used within GardenProvider');
  return ctx;
}

export function getTreeStatus(tree: Tree): TreeStatus {
  if (tree.harvested) return 'harvested';
  const config = TREE_CONFIGS[tree.type];
  if (tree.wateringsCompleted >= config.wateringsRequired) return 'fruiting';
  if (tree.lastWateredAt === null) return 'needs_first_water';
  const elapsed = Date.now() - tree.lastWateredAt;
  if (elapsed < WATERING_INTERVAL_MS) return 'growing';
  return 'needs_water';
}

export function GardenProvider({ children }: { children: React.ReactNode }) {
  const telegram = useTelegram();
  const { dbUser, trees: dbTrees, loading: dbLoading, updateUser, addTree, updateTree: updateDbTree, refreshUser, refreshTrees } = useSupabaseUser();

  const [currentTreeIndex, setCurrentTreeIndex] = useState(0);
  const [showingAd, setShowingAd] = useState(false);
  const [adCount, setAdCount] = useState(6);
  const adCallbackRef = useRef<(() => void) | null>(null);
  const [referredUsers, setReferredUsers] = useState<string[]>([]);
  const [, tick] = useState(0);

  // Load referrals
  useEffect(() => {
    if (!dbUser) return;
    supabase
      .from('referrals')
      .select('referred_telegram_id')
      .eq('referrer_telegram_id', dbUser.telegram_id)
      .then(({ data }) => {
        if (data) setReferredUsers(data.map((r: any) => r.referred_telegram_id));
      });
  }, [dbUser?.telegram_id]);

  // Tick every second for timers
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Build userData for compatibility
  const userData: UserData = dbUser
    ? dbToUserData(dbUser, dbTrees, referredUsers)
    : {
        telegramId: telegram.id,
        username: telegram.username,
        coins: 0,
        trees: [],
        currentTreeIndex: 0,
        hasClaimedFreeSapling: false,
        fruits: { apple: 0, pear: 0, grape: 0, fig: 0 },
        stats: { totalTreesGrown: 0, totalFruitsHarvested: 0, totalAdsWatched: 0 },
        adTask: { lastResetDate: '', adsWatched: 0, totalAdsWatched: 0 },
        referral: { referralCode: '', referredUsers: [], totalEarnings: 0 },
      };

  userData.currentTreeIndex = currentTreeIndex;

  const currentTree = userData.trees[currentTreeIndex] ?? null;
  const currentTreeStatus = currentTree ? getTreeStatus(currentTree) : null;
  const currentTreeConfig = currentTree ? TREE_CONFIGS[currentTree.type] : null;
  const hasActiveTree = userData.trees.some((t) => !t.harvested);

  const growthPercent = currentTree && currentTreeConfig
    ? (currentTree.wateringsCompleted / currentTreeConfig.wateringsRequired) * 100
    : 0;

  const timeUntilNextWater = currentTree?.lastWateredAt != null
    ? Math.max(0, WATERING_INTERVAL_MS - (Date.now() - currentTree.lastWateredAt))
    : 0;

  const canWater = currentTreeStatus === 'needs_water' || currentTreeStatus === 'needs_first_water';

  const triggerAd = useCallback((callback: () => void, count: number = 6) => {
    adCallbackRef.current = callback;
    setAdCount(count);
    setShowingAd(true);
  }, []);

  const completeAd = useCallback(() => {
    setShowingAd(false);
    if (dbUser) {
      updateUser({ total_ads_watched: dbUser.total_ads_watched + 1 } as any);
    }
    const cb = adCallbackRef.current;
    adCallbackRef.current = null;
    cb?.();
  }, [dbUser, updateUser]);

  const waterTree = useCallback(() => {
    if (!canWater || !currentTree || !dbUser) return;
    triggerAd(async () => {
      const dbTreeId = dbTrees[currentTreeIndex]?.id;
      if (!dbTreeId) return;
      const newCount = currentTree.wateringsCompleted + 1;
      const cfg = TREE_CONFIGS[currentTree.type];
      
      await updateDbTree(dbTreeId, {
        waterings_completed: newCount,
        last_watered_at: new Date().toISOString(),
      } as any);

      if (newCount >= cfg.wateringsRequired) {
        await updateUser({
          total_trees_grown: dbUser.total_trees_grown + 1,
        } as any);
      }
    }, 6);
  }, [canWater, currentTree, dbUser, currentTreeIndex, dbTrees, triggerAd, updateDbTree, updateUser]);

  const harvestTree = useCallback(async () => {
    if (!currentTree || currentTreeStatus !== 'fruiting' || !dbUser) return;
    const cfg = TREE_CONFIGS[currentTree.type];
    const dbTreeId = dbTrees[currentTreeIndex]?.id;
    if (!dbTreeId) return;

    await updateDbTree(dbTreeId, { harvested: true } as any);

    const fruitKey = `fruits_${currentTree.type}` as keyof DbUser;
    await updateUser({
      [fruitKey]: (dbUser[fruitKey] as number) + cfg.fruitCount,
      total_fruits_harvested: dbUser.total_fruits_harvested + cfg.fruitCount,
    } as any);
  }, [currentTree, currentTreeStatus, dbUser, dbTrees, currentTreeIndex, updateDbTree, updateUser]);

  const buySapling = useCallback((type: TreeType): boolean => {
    if (hasActiveTree || !dbUser) return false;
    const cfg = TREE_CONFIGS[type];
    if (dbUser.coins < cfg.saplingCost) return false;

    (async () => {
      await updateUser({ coins: dbUser.coins - cfg.saplingCost } as any);
      const newTree = await addTree(type);
      if (newTree) {
        await refreshTrees();
        setCurrentTreeIndex(dbTrees.length);
      }
    })();
    return true;
  }, [dbUser, hasActiveTree, addTree, updateUser, refreshTrees, dbTrees.length]);

  const claimFreeSapling = useCallback(() => {
    if (!dbUser || dbUser.has_claimed_free_sapling || hasActiveTree) return;
    triggerAd(async () => {
      await updateUser({ has_claimed_free_sapling: true } as any);
      const newTree = await addTree('apple');
      if (newTree) {
        await refreshTrees();
        setCurrentTreeIndex(dbTrees.length);
      }
    }, 6);
  }, [dbUser, hasActiveTree, triggerAd, addTree, updateUser, refreshTrees, dbTrees.length]);

  const selectTree = useCallback((index: number) => {
    if (index >= 0 && index < userData.trees.length) {
      setCurrentTreeIndex(index);
    }
  }, [userData.trees.length]);

  const watchAdTask = useCallback(() => {
    if (!dbUser) return;
    const today = getUZTDateString();

    const currentWatched = dbUser.ad_task_last_reset_date === today ? dbUser.ad_task_ads_watched : 0;
    if (currentWatched >= AD_TASK_DAILY_MAX) return;

    triggerAd(async () => {
      const resetDate = dbUser.ad_task_last_reset_date === today ? dbUser.ad_task_last_reset_date : today;
      const watched = dbUser.ad_task_last_reset_date === today ? dbUser.ad_task_ads_watched : 0;
      const newCount = watched + 1;

      await updateUser({
        coins: dbUser.coins + AD_TASK_COIN_PER_AD,
        ad_task_last_reset_date: resetDate,
        ad_task_ads_watched: newCount,
        ad_task_total_ads_watched: (dbUser.ad_task_total_ads_watched || 0) + 1,
      } as any);
    }, 1);
  }, [dbUser, triggerAd, updateUser]);

  const joinChannel = useCallback((channelId: string) => {
    window.open(`https://t.me/${channelId.replace('@', '')}`, '_blank');
  }, []);

  const verifyChannel = useCallback(async (channelId: string) => {
    if (!dbUser) return;

    // Check if already completed
    const { data: existing } = await supabase
      .from('channel_tasks_completed')
      .select('id')
      .eq('user_telegram_id', dbUser.telegram_id)
      .eq('channel_id', channelId)
      .maybeSingle();

    if (existing) return;

    // Get reward from DB channel tasks
    const { data: channelTask } = await supabase
      .from('channel_tasks')
      .select('reward')
      .eq('channel_id', channelId)
      .eq('is_active', true)
      .maybeSingle();

    const reward = channelTask?.reward || 10;

    await supabase.from('channel_tasks_completed').insert({
      user_telegram_id: dbUser.telegram_id,
      channel_id: channelId,
    } as any);

    await updateUser({ coins: dbUser.coins + reward } as any);
  }, [dbUser, updateUser]);

  const shareReferral = useCallback(() => {
    if (!dbUser) return;
    const link = `https://t.me/BloomPaybot?start=${dbUser.referral_code}`;
    const tg = window.Telegram?.WebApp;
    if (tg) {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("🌱 BloomPay'ga qo'shiling!")}`, '_blank');
    } else {
      navigator.clipboard.writeText(link);
    }
  }, [dbUser]);

  const sellFruit = useCallback(async (type: TreeType, amount: number) => {
    if (!dbUser) return;
    const fruitKey = `fruits_${type}` as keyof DbUser;
    const available = dbUser[fruitKey] as number;
    const sellAmount = Math.min(amount, available);
    if (sellAmount <= 0) return;
    const cfg = TREE_CONFIGS[type];

    await updateUser({
      [fruitKey]: available - sellAmount,
      coins: dbUser.coins + sellAmount * cfg.fruitValue,
    } as any);
  }, [dbUser, updateUser]);

  return (
    <GardenContext.Provider
      value={{
        userData,
        currentTree,
        currentTreeStatus,
        currentTreeConfig,
        growthPercent,
        timeUntilNextWater,
        canWater,
        hasActiveTree,
        waterTree,
        harvestTree,
        buySapling,
        claimFreeSapling,
        selectTree,
        showingAd,
        adCount,
        triggerAd,
        completeAd,
        watchAdTask,
        joinChannel,
        verifyChannel,
        shareReferral,
        sellFruit,
        loading: dbLoading,
      }}
    >
      {children}
    </GardenContext.Provider>
  );
}
