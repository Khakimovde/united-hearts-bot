import { useState } from 'react';
import { useGarden } from '@/contexts/GardenContext';
import { useTelegram } from '@/hooks/useTelegram';
import { Trophy, TreeDeciduous, Cherry, Crown, Medal } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types';

type Period = 'daily' | 'weekly' | 'allTime';

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Kunlik',
  weekly: 'Haftalik',
  allTime: 'Umumiy',
};

function generateMockLeaderboard(period: Period, currentUser: LeaderboardEntry): LeaderboardEntry[] {
  const mockUsers: LeaderboardEntry[] = [
    { telegramId: '100001', username: 'bogbon_ali', firstName: 'Ali', totalTreesGrown: 45, totalFruitsHarvested: 120, coins: 2400 },
    { telegramId: '100002', username: 'dehqon_sara', firstName: 'Sara', totalTreesGrown: 38, totalFruitsHarvested: 95, coins: 1900 },
    { telegramId: '100003', username: 'mevachi_bob', firstName: 'Bobur', totalTreesGrown: 32, totalFruitsHarvested: 80, coins: 1600 },
    { telegramId: '100004', username: 'daraxtchi', firstName: 'Kamol', totalTreesGrown: 28, totalFruitsHarvested: 70, coins: 1400 },
    { telegramId: '100005', username: 'sabzavotchi', firstName: 'Nilufar', totalTreesGrown: 25, totalFruitsHarvested: 62, coins: 1250 },
    { telegramId: '100006', username: 'gulchi_22', firstName: 'Jasur', totalTreesGrown: 20, totalFruitsHarvested: 50, coins: 1000 },
    { telegramId: '100007', username: 'fermachi', firstName: 'Malika', totalTreesGrown: 18, totalFruitsHarvested: 45, coins: 900 },
    { telegramId: '100008', username: 'tabiat_uz', firstName: 'Otabek', totalTreesGrown: 15, totalFruitsHarvested: 38, coins: 750 },
    { telegramId: '100009', username: 'ko_chat', firstName: 'Dilnoza', totalTreesGrown: 12, totalFruitsHarvested: 30, coins: 600 },
  ];

  const factor = period === 'daily' ? 0.1 : period === 'weekly' ? 0.4 : 1;
  const scaled = mockUsers.map((u) => ({
    ...u,
    totalTreesGrown: Math.round(u.totalTreesGrown * factor),
    totalFruitsHarvested: Math.round(u.totalFruitsHarvested * factor),
    coins: Math.round(u.coins * factor),
  }));

  const all = [...scaled, currentUser].sort(
    (a, b) => b.totalTreesGrown - a.totalTreesGrown || b.totalFruitsHarvested - a.totalFruitsHarvested,
  );
  return all.slice(0, 10);
}

export default function Leaderboard() {
  const [period, setPeriod] = useState<Period>('daily');
  const { userData } = useGarden();
  const telegram = useTelegram();

  const currentUserEntry: LeaderboardEntry = {
    telegramId: userData.telegramId,
    username: telegram.username,
    firstName: telegram.firstName,
    totalTreesGrown: userData.stats.totalTreesGrown,
    totalFruitsHarvested: userData.stats.totalFruitsHarvested,
    coins: userData.coins,
  };

  const leaderboard = generateMockLeaderboard(period, currentUserEntry);

  return (
    <div className="px-4 py-3 pb-28" style={{ background: 'linear-gradient(180deg, hsl(20 30% 96%) 0%, hsl(15 20% 93%) 100%)', minHeight: '100vh' }}>
      <h1 className="text-xl font-bold text-foreground mb-4">
        <Trophy className="w-5 h-5 inline-block mr-2" style={{ color: 'hsl(38 85% 52%)' }} />
        Liderlar jadvali
      </h1>

      {/* Period tabs */}
      <div className="flex gap-1.5 rounded-xl p-1 mb-5" style={{ background: 'hsl(20 15% 90%)' }}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200"
            style={period === p ? {
              background: 'white',
              color: 'hsl(0 75% 50%)',
              boxShadow: '0 2px 8px hsl(0 0% 0% / 0.08)',
              borderBottom: '3px solid hsl(0 75% 50%)',
            } : {
              color: 'hsl(25 8% 55%)',
            }}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {leaderboard.slice(0, 3).map((entry, idx) => {
          const Icon = [Crown, Medal, Medal][idx];
          const isCurrentUser = entry.telegramId === userData.telegramId;
          const podiumColors = [
            { bg: 'hsl(45 90% 55% / 0.15)', border: 'hsl(45 80% 50% / 0.4)', icon: 'hsl(45 80% 45%)' },
            { bg: 'hsl(220 10% 70% / 0.15)', border: 'hsl(220 10% 65% / 0.3)', icon: 'hsl(220 10% 55%)' },
            { bg: 'hsl(25 60% 55% / 0.15)', border: 'hsl(25 60% 50% / 0.25)', icon: 'hsl(25 60% 45%)' },
          ];
          return (
            <div
              key={entry.telegramId}
              className={`
                relative rounded-2xl p-3 text-center
                ${idx === 0 ? 'pt-2' : 'pt-4'}
              `}
              style={{
                background: podiumColors[idx].bg,
                border: `2px solid ${podiumColors[idx].border}`,
                borderBottom: `4px solid ${podiumColors[idx].border}`,
                boxShadow: isCurrentUser ? '0 0 0 2px hsl(0 75% 50% / 0.3)' : undefined,
              }}
            >
              <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: podiumColors[idx].icon }} />
              <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-1.5"
                style={{ background: 'hsl(0 75% 50% / 0.1)' }}
              >
                <span className="text-lg">
                  {idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}
                </span>
              </div>
              <p className="text-xs font-bold text-card-foreground truncate">{entry.firstName}</p>
              <p className="text-[10px] text-muted-foreground truncate">@{entry.username}</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <TreeDeciduous className="w-3 h-3" style={{ color: 'hsl(145 40% 45%)' }} />
                <span className="text-xs font-bold text-card-foreground tabular-nums">{entry.totalTreesGrown}</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Cherry className="w-3 h-3 text-accent" />
                <span className="text-[10px] text-muted-foreground tabular-nums">{entry.totalFruitsHarvested}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      <div className="space-y-2">
        {leaderboard.slice(3).map((entry, idx) => {
          const rank = idx + 4;
          const isCurrentUser = entry.telegramId === userData.telegramId;
          return (
            <div
              key={entry.telegramId}
              className="card-cartoon p-3.5 flex items-center gap-3"
              style={isCurrentUser ? { borderColor: 'hsl(0 70% 80%)', boxShadow: '0 0 0 2px hsl(0 75% 50% / 0.2)' } : {}}
            >
              <span className="w-7 text-center text-sm font-bold text-muted-foreground tabular-nums">{rank}</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsl(0 75% 50% / 0.08)' }}
              >
                <span className="text-sm">🧑‍🌾</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-card-foreground truncate">
                  {entry.firstName}
                  {isCurrentUser && <span className="text-xs ml-1" style={{ color: 'hsl(0 75% 50%)' }}>(Siz)</span>}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">@{entry.username}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 justify-end">
                  <TreeDeciduous className="w-3 h-3" style={{ color: 'hsl(145 40% 45%)' }} />
                  <span className="text-xs font-bold text-card-foreground tabular-nums">{entry.totalTreesGrown}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <Cherry className="w-3 h-3 text-accent" />
                  <span className="text-[10px] text-muted-foreground tabular-nums">{entry.totalFruitsHarvested}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
