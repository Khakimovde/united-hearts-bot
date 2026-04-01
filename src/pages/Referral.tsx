import { useGarden } from '@/contexts/GardenContext';
import { useTelegram } from '@/hooks/useTelegram';
import { CoinBalance } from '@/components/CoinBalance';
import { Gift, Copy, Users, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { REFERRAL_REWARD, REFERRAL_LEVELS, getReferralLevel, getNextReferralLevel } from '@/lib/gameConfig';

export default function Referral() {
  const { userData, shareReferral } = useGarden();
  const telegram = useTelegram();
  const [copied, setCopied] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const referralLink = `https://t.me/BloomPaybot?start=${userData.referral.referralCode}`;
  const referralCount = userData.referral.referredUsers.length;
  const currentLevel = getReferralLevel(referralCount);
  const nextLevel = getNextReferralLevel(currentLevel);
  const progressToNext = nextLevel
    ? Math.min(((referralCount - currentLevel.minReferrals) / (nextLevel.minReferrals - currentLevel.minReferrals)) * 100, 100)
    : 100;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="px-4 py-3 pb-28 overflow-auto" style={{ background: 'linear-gradient(180deg, hsl(20 30% 96%) 0%, hsl(15 20% 93%) 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">
          <Users className="w-5 h-5 inline-block mr-2" style={{ color: 'hsl(0 75% 50%)' }} />
          Referal dasturi
        </h1>
        <CoinBalance />
      </div>

      {/* Current Level */}
      <div className="card-flat p-5 mb-4 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <img src={currentLevel.image} alt={currentLevel.name} className="w-14 h-14 rounded-2xl object-contain" width={56} height={56} />
          <div className="flex-1">
            <h3 className="font-bold text-card-foreground text-base">
              Daraja {currentLevel.id}: {currentLevel.name}
            </h3>
            <p className="text-sm font-bold" style={{ color: currentLevel.color }}>
              {currentLevel.percent}% komissiya
            </p>
          </div>
        </div>
        {nextLevel && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Keyingi: {nextLevel.name} ({nextLevel.percent}%)</span>
              <span className="font-bold" style={{ color: 'hsl(0 75% 50%)' }}>{referralCount}/{nextLevel.minReferrals}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressToNext}%`,
                  background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card-flat p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: 'hsl(0 75% 50%)' }}>{referralCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Taklif qilinganlar</p>
        </div>
        <div className="card-flat p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: 'hsl(38 85% 52%)' }}>{userData.referral.totalEarnings}</p>
          <p className="text-xs text-muted-foreground mt-1">Ishlangan tanga</p>
        </div>
      </div>

      {/* Share */}
      <div className="card-flat p-5 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <Gift className="w-5 h-5" style={{ color: 'hsl(0 75% 50%)' }} />
          <div>
            <h3 className="font-bold text-card-foreground text-sm">Do'stlaringizni taklif qiling</h3>
            <p className="text-xs text-muted-foreground">Do'stingiz ishlagan tangadan {currentLevel.percent}% olasiz</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl p-3 mb-3" style={{ background: 'hsl(20 15% 92%)' }}>
          <p className="text-xs text-muted-foreground flex-1 truncate font-mono">{referralLink}</p>
          <button onClick={handleCopyLink} className="flex-shrink-0 p-2 rounded-lg bg-card active:scale-95 transition-all">
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        {copied && <p className="text-xs text-center mb-2" style={{ color: 'hsl(145 50% 40%)' }}>✓ Nusxalandi!</p>}
        <button onClick={shareReferral} className="btn-cartoon w-full py-3 flex items-center justify-center gap-2">
          <Gift className="w-4 h-4" /> Telegramda ulashish
        </button>
      </div>

      {/* All Levels */}
      <h3 className="font-bold text-foreground text-sm mb-3 px-1">📊 Barcha darajalar</h3>
      <div className="space-y-2">
        {REFERRAL_LEVELS.map((level) => {
          const isActive = level.id === currentLevel.id;
          const isLocked = referralCount < level.minReferrals;
          const isExpanded = expandedLevel === level.id;

          return (
            <div
              key={level.id}
              className={`card-flat overflow-hidden transition-all duration-300 ${isActive ? 'ring-2' : ''}`}
              style={isActive ? { borderColor: `${level.color}60`, boxShadow: `0 0 0 2px ${level.color}30` } : {}}
            >
              <button
                onClick={() => setExpandedLevel(isExpanded ? null : level.id)}
                className="w-full p-3.5 flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: isLocked ? 'hsl(0 0% 95%)' : `${level.color}10` }}
                >
                  <img
                    src={level.image}
                    alt={level.name}
                    className="w-9 h-9 object-contain"
                    style={isLocked ? { filter: 'grayscale(100%) opacity(0.4)' } : {}}
                    width={36} height={36} loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isLocked ? 'text-muted-foreground' : 'text-card-foreground'}`}>
                      {level.name}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${level.color}20`, color: level.color }}
                      >Hozirgi</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {level.minReferrals > 0 ? `${level.minReferrals}+ referal` : "Boshlang'ich"} • {level.percent}%
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-lg font-bold" style={{ color: isLocked ? 'hsl(0 0% 70%)' : level.color }}>
                    {level.percent}%
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isExpanded ? '200px' : '0px' }}>
                <div className="px-3.5 pb-3.5 pt-0">
                  <div className="rounded-xl p-3 space-y-2" style={{ background: isLocked ? 'hsl(0 0% 96%)' : `${level.color}08` }}>
                    <p className="text-xs text-muted-foreground">{level.description}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Kerakli referallar:</span>
                      <span className="font-bold" style={{ color: isLocked ? 'hsl(0 0% 55%)' : level.color }}>{level.minReferrals}+</span>
                    </div>
                    {isLocked && (
                      <p className="text-[11px] font-medium mt-1" style={{ color: 'hsl(0 75% 50%)' }}>
                        🔒 Yana {level.minReferrals - referralCount} ta referal kerak
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="card-flat p-4 mt-5">
        <h3 className="font-bold text-card-foreground text-sm mb-2">💡 Qanday ishlaydi?</h3>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>• Do'stlaringizni taklif qiling va tanga ishlang</p>
          <p>• Chaqirgan odamingiz ishlagan tangadan {currentLevel.percent}% olasiz</p>
          <p>• Ko'proq referal = yuqori daraja = ko'proq foiz</p>
        </div>
      </div>
    </div>
  );
}
