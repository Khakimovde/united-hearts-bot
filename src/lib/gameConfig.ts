import type { TreeConfig, TreeType, ChannelTask } from './types';

export const WATERING_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export const AD_DURATION_MS = 3000; // 3 seconds simulated

export const AD_TASK_DAILY_MAX = 500;
export const AD_TASK_COIN_PER_AD = 6; // coins per single ad watched

// Referral reward is percentage-based, not fixed coins
// See REFERRAL_LEVELS for percent values

export const ADMIN_TELEGRAM_ID = '5326022510';

export const CHANNEL_TASKS: ChannelTask[] = [
  { channelId: '@virtual_bog_uz', channelName: 'Virtual Bog\'', joined: false, reward: 10 },
  { channelId: '@virtual_bog_news', channelName: 'Virtual Bog\' Yangiliklar', joined: false, reward: 10 },
];

// Payment tiers — based on trees grown + referrals
import tier1Img from '@/assets/tier-1-sprout.png';
import tier2Img from '@/assets/tier-2-greenleaf.png';
import tier3Img from '@/assets/tier-3-bloom.png';
import tier4Img from '@/assets/tier-4-harvest.png';
import tier5Img from '@/assets/tier-5-evergreen.png';
import tier6Img from '@/assets/tier-6-ancient.png';
import tier7Img from '@/assets/tier-7-mythic.png';

export interface PaymentLevel {
  id: number;
  name: string;
  image: string;
  minTrees: number;
  minReferrals: number;
  processingDays: number;
  weeklyLimit: number;
  color: string;
  darkColor: string;
  description: string;
}

export const PAYMENT_LEVELS: PaymentLevel[] = [
  { id: 1, name: 'Sprout', image: tier1Img, minTrees: 0, minReferrals: 0, processingDays: 7, weeklyLimit: 17000, color: 'hsl(145 35% 55%)', darkColor: 'hsl(145 35% 40%)', description: "Boshlang'ich daraja. So'rovlar 7 ish kunida ko'rib chiqiladi." },
  { id: 2, name: 'Greenleaf', image: tier2Img, minTrees: 15, minReferrals: 20, processingDays: 6, weeklyLimit: 25500, color: 'hsl(120 40% 50%)', darkColor: 'hsl(120 40% 35%)', description: "15 daraxt + 20 referal. 6 ish kuni. Haftasiga 25,500 tanga." },
  { id: 3, name: 'Bloom', image: tier3Img, minTrees: 30, minReferrals: 35, processingDays: 5, weeklyLimit: 42500, color: 'hsl(200 60% 50%)', darkColor: 'hsl(200 60% 35%)', description: "30 daraxt + 35 referal. 5 ish kuni. Haftasiga 42,500 tanga." },
  { id: 4, name: 'Harvest', image: tier4Img, minTrees: 80, minReferrals: 100, processingDays: 4, weeklyLimit: 68000, color: 'hsl(38 80% 52%)', darkColor: 'hsl(38 80% 38%)', description: "80 daraxt + 100 referal. 4 ish kuni. Haftasiga 68,000 tanga." },
  { id: 5, name: 'Evergreen', image: tier5Img, minTrees: 150, minReferrals: 270, processingDays: 3, weeklyLimit: 119000, color: 'hsl(280 60% 55%)', darkColor: 'hsl(280 60% 40%)', description: "150 daraxt + 270 referal. 3 ish kuni. Haftasiga 119,000 tanga." },
  { id: 6, name: 'Ancient Oak', image: tier6Img, minTrees: 250, minReferrals: 450, processingDays: 2, weeklyLimit: 204000, color: 'hsl(0 75% 50%)', darkColor: 'hsl(0 75% 38%)', description: "250 daraxt + 450 referal. 2 ish kuni. Haftasiga 204,000 tanga." },
  { id: 7, name: 'Mythic Tree', image: tier7Img, minTrees: 400, minReferrals: 700, processingDays: 2, weeklyLimit: 340000, color: 'hsl(45 90% 50%)', darkColor: 'hsl(45 90% 38%)', description: "400 daraxt + 700 referal. Eng tez — 2 ish kuni. Haftasiga 340,000 tanga!" },
];

// Referral tiers — based on referral count only
import rookieImg from '@/assets/referral-rookie.png';
import connectorImg from '@/assets/referral-connector.png';
import builderImg from '@/assets/referral-builder.png';
import influencerImg from '@/assets/referral-influencer.png';
import strategistImg from '@/assets/referral-strategist.png';
import kingImg from '@/assets/referral-king.png';
import legendaryImg from '@/assets/referral-legendary.png';

export interface ReferralLevel {
  id: number;
  name: string;
  image: string;
  minReferrals: number;
  percent: number;
  color: string;
  description: string;
}

export const REFERRAL_LEVELS: ReferralLevel[] = [
  { id: 1, name: 'Rookie', image: rookieImg, minReferrals: 0, percent: 2, color: 'hsl(145 35% 55%)', description: "Boshlang'ich daraja. Do'stlaringizni taklif qilishni boshlang!" },
  { id: 2, name: 'Connector', image: connectorImg, minReferrals: 10, percent: 4, color: 'hsl(120 40% 50%)', description: '10 ta referal. 4% komissiya.' },
  { id: 3, name: 'Builder', image: builderImg, minReferrals: 25, percent: 6, color: 'hsl(200 60% 50%)', description: '25 ta referal. 6% komissiya.' },
  { id: 4, name: 'Influencer', image: influencerImg, minReferrals: 80, percent: 8, color: 'hsl(280 60% 55%)', description: '80 ta referal. 8% komissiya.' },
  { id: 5, name: 'Strategist', image: strategistImg, minReferrals: 150, percent: 10, color: 'hsl(38 80% 52%)', description: '150 ta referal. 10% komissiya.' },
  { id: 6, name: 'Network King', image: kingImg, minReferrals: 250, percent: 12, color: 'hsl(0 75% 50%)', description: '250 ta referal. 12% komissiya.' },
  { id: 7, name: 'Legendary Circle', image: legendaryImg, minReferrals: 400, percent: 15, color: 'hsl(45 90% 50%)', description: '400+ referal. Maksimal 15% komissiya!' },
];

export function getPaymentLevel(treesGrown: number, referralCount: number): PaymentLevel {
  let level = PAYMENT_LEVELS[0];
  for (const l of PAYMENT_LEVELS) {
    if (treesGrown >= l.minTrees && referralCount >= l.minReferrals) level = l;
  }
  return level;
}

export function getNextPaymentLevel(current: PaymentLevel): PaymentLevel | null {
  const idx = PAYMENT_LEVELS.findIndex(l => l.id === current.id);
  return idx < PAYMENT_LEVELS.length - 1 ? PAYMENT_LEVELS[idx + 1] : null;
}

export function getReferralLevel(referralCount: number): ReferralLevel {
  let level = REFERRAL_LEVELS[0];
  for (const l of REFERRAL_LEVELS) {
    if (referralCount >= l.minReferrals) level = l;
  }
  return level;
}

export function getNextReferralLevel(current: ReferralLevel): ReferralLevel | null {
  const idx = REFERRAL_LEVELS.findIndex(l => l.id === current.id);
  return idx < REFERRAL_LEVELS.length - 1 ? REFERRAL_LEVELS[idx + 1] : null;
}

export const MIN_WITHDRAW = 11000;

export const TREE_CONFIGS: Record<TreeType, TreeConfig> = {
  apple: {
    type: 'apple',
    name: 'Olma daraxti',
    growthHours: 2,
    wateringsRequired: 8,
    fruitCount: 12,
    fruitValue: 10,
    saplingCost: 100,
    description: "Oddiy olma daraxti. 12 ta meva, har biri 10 tanga.",
    emoji: '🍎',
  },
  pear: {
    type: 'pear',
    name: 'Nok daraxti',
    growthHours: 4,
    wateringsRequired: 16,
    fruitCount: 30,
    fruitValue: 12,
    saplingCost: 300,
    description: "Shirin nok daraxti. 30 ta meva, har biri 12 tanga.",
    emoji: '🍐',
  },
  grape: {
    type: 'grape',
    name: 'Uzum tokasi',
    growthHours: 6,
    wateringsRequired: 24,
    fruitCount: 80,
    fruitValue: 13,
    saplingCost: 800,
    description: 'Mazali uzum. 80 ta meva, har biri 13 tanga.',
    emoji: '🍇',
  },
  fig: {
    type: 'fig',
    name: 'Anjir daraxti',
    growthHours: 8,
    wateringsRequired: 32,
    fruitCount: 180,
    fruitValue: 14,
    saplingCost: 2000,
    description: 'Premium anjir. 180 ta meva, har biri 14 tanga.',
    emoji: '🫐',
  },
};

// Weekly limit reset helper — returns true if it's a new week (Monday reset)
export function getWeekStartMonday(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const uzt = new Date(utc + 5 * 3600000);
  const day = uzt.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  const monday = new Date(uzt);
  monday.setDate(uzt.getDate() - diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}
