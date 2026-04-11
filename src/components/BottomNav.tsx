import { useLocation, useNavigate } from 'react-router-dom';
import { Flower2, Store, ListChecks, Users, Wallet, User, Dices, type LucideIcon } from 'lucide-react';

interface TabItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const tabs: TabItem[] = [
  { path: '/', icon: Flower2, label: "Bog'" },
  { path: '/market', icon: Store, label: 'Bozor' },
  { path: '/lottery', icon: Dices, label: 'Lotereya' },
  { path: '/tasks', icon: ListChecks, label: 'Vazifalar' },
  { path: '/referral', icon: Users, label: 'Referal' },
  { path: '/payments', icon: Wallet, label: "To'lovlar" },
  { path: '/profile', icon: User, label: 'Profil' },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t-2"
      style={{
        paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom, 0.4rem))',
        background: 'linear-gradient(180deg, hsl(30 25% 98%) 0%, hsl(25 20% 95%) 100%)',
        borderColor: 'hsl(20 15% 88%)',
        boxShadow: '0 -4px 16px hsl(0 0% 0% / 0.06)',
      }}
    >
      <div className="flex justify-around py-1">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition-all duration-200"
              style={{
                color: active ? 'hsl(0 75% 50%)' : 'hsl(25 8% 55%)',
              }}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[8px] font-bold leading-tight">{label}</span>
              {active && (
                <div className="w-1 h-1 rounded-full" style={{ background: 'hsl(0 75% 50%)' }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
