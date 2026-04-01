import { Sprout, Trees, CloudSun, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGarden } from '@/contexts/GardenContext';

export function EmptyGarden() {
  const { userData, claimFreeSapling } = useGarden();
  const navigate = useNavigate();

  return (
    <div 
      className="flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ minHeight: 'calc(100vh - 80px)' }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating clouds */}
        <div className="absolute top-8 left-4 animate-float opacity-60">
          <CloudSun className="w-12 h-12 text-primary/30" />
        </div>
        <div className="absolute top-16 right-8 animate-float opacity-40" style={{ animationDelay: '1s' }}>
          <CloudSun className="w-8 h-8 text-primary/20" />
        </div>
        <div className="absolute top-24 left-1/4 animate-float opacity-50" style={{ animationDelay: '2s' }}>
          <CloudSun className="w-6 h-6 text-primary/25" />
        </div>

        {/* Sparkles */}
        <div className="absolute top-1/4 right-1/4 animate-soft-pulse">
          <Sparkles className="w-5 h-5 text-accent/50" />
        </div>
        <div className="absolute top-1/3 left-1/5 animate-soft-pulse" style={{ animationDelay: '0.5s' }}>
          <Sparkles className="w-4 h-4 text-accent/40" />
        </div>

        {/* Background trees silhouettes */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end opacity-10">
          <Trees className="w-24 h-24 text-primary" style={{ transform: 'translateY(20%)' }} />
          <Trees className="w-32 h-32 text-primary" style={{ transform: 'translateY(10%)' }} />
          <Trees className="w-20 h-20 text-primary" style={{ transform: 'translateY(30%)' }} />
        </div>

        {/* Ground gradient */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{
            background: 'linear-gradient(to top, hsl(var(--primary) / 0.15), transparent)'
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* 3D-style garden pot with sprout */}
        <div className="relative mb-8">
          {/* Glow effect */}
          <div 
            className="absolute inset-0 blur-2xl rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
              transform: 'scale(1.5)'
            }}
          />
          
          {/* Main container */}
          <div 
            className="relative w-32 h-32 rounded-full flex items-center justify-center animate-float"
            style={{
              background: 'linear-gradient(145deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1))',
              boxShadow: `
                0 20px 40px -10px hsl(var(--primary) / 0.3),
                inset 0 -8px 20px hsl(var(--primary) / 0.1),
                inset 0 8px 20px hsl(var(--background) / 0.5)
              `
            }}
          >
            {/* Inner circle with sprout */}
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--card)), hsl(var(--background)))',
                boxShadow: 'inset 0 4px 12px hsl(var(--primary) / 0.1)'
              }}
            >
              <Sprout className="w-12 h-12 text-primary animate-soft-pulse" />
            </div>
          </div>

          {/* Decorative ring */}
          <div 
            className="absolute -inset-2 rounded-full pointer-events-none"
            style={{
              border: '2px dashed hsl(var(--primary) / 0.2)',
              animation: 'spin 30s linear infinite'
            }}
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-3 text-center">
          🌿 Bog'ingiz kutmoqda
        </h2>
        
        <p className="text-muted-foreground text-center mb-8 max-w-[280px] leading-relaxed">
          Birinchi daraxtingizni eking va o'zingizning raqamli bog'ingizni yarating
        </p>

        {/* Action button */}
        {!userData.hasClaimedFreeSapling ? (
          <button
            onClick={claimFreeSapling}
            className="group relative px-8 py-4 rounded-2xl font-semibold text-base active:scale-[0.97] transition-all duration-300 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(145 35% 22%))',
              boxShadow: '0 12px 32px -8px hsl(145 35% 28% / 0.5)'
            }}
          >
            {/* Button shine effect */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(var(--background) / 0.2), transparent)',
                transform: 'translateX(-100%)',
                animation: 'shimmer 2s infinite'
              }}
            />
            
            <span className="relative flex items-center gap-3 text-primary-foreground">
              <span className="text-xl">🌱</span>
              <span>Bepul olma ko'chati</span>
              <span className="text-xl">🎁</span>
            </span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/market')}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-semibold text-base active:scale-[0.97] transition-transform"
            style={{
              boxShadow: '0 8px 24px -8px hsl(145 35% 28% / 0.35)'
            }}
          >
            🛒 Bozorga boring
          </button>
        )}

        {/* Feature hints */}
        <div className="flex gap-6 mt-10 text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              💧
            </div>
            <span>Sug'oring</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              🍎
            </div>
            <span>Yig'ing</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              💰
            </div>
            <span>Soting</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
