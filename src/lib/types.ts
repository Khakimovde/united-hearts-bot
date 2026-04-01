export type TreeType = 'apple' | 'pear' | 'grape' | 'fig';

export type TreeStatus =
  | 'needs_first_water'
  | 'growing'
  | 'needs_water'
  | 'fruiting'
  | 'harvested';

export interface Tree {
  id: string;
  type: TreeType;
  plantedAt: number;
  wateringsCompleted: number;
  lastWateredAt: number | null;
  harvested: boolean;
}

export interface AdTask {
  lastResetDate: string; // YYYY-MM-DD in UZT
  adsWatched: number;    // 0-700
  totalAdsWatched: number;
}

export interface ReferralInfo {
  referralCode: string;
  referredUsers: string[];   // telegram IDs
  totalEarnings: number;
}

export interface ChannelTask {
  channelId: string;
  channelName: string;
  joined: boolean;
  reward: number;
}

export interface LeaderboardEntry {
  telegramId: string;
  username: string;
  firstName: string;
  totalTreesGrown: number;
  totalFruitsHarvested: number;
  coins: number;
}

export interface FruitInventory {
  apple: number;
  pear: number;
  grape: number;
  fig: number;
}

export interface UserData {
  telegramId: string;
  username: string;
  coins: number;
  trees: Tree[];
  currentTreeIndex: number;
  hasClaimedFreeSapling: boolean;
  fruits: FruitInventory;
  stats: {
    totalTreesGrown: number;
    totalFruitsHarvested: number;
    totalAdsWatched: number;
  };
  adTask: AdTask;
  referral: ReferralInfo;
}

export interface TreeConfig {
  type: TreeType;
  name: string;
  growthHours: number;
  wateringsRequired: number;
  fruitCount: number;
  fruitValue: number;
  saplingCost: number;
  description: string;
  emoji: string;
}