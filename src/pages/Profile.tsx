import { useGarden } from '@/contexts/GardenContext';
import { useTelegram } from '@/hooks/useTelegram';
import { getPaymentLevel, getReferralLevel, ADMIN_TELEGRAM_ID } from '@/lib/gameConfig';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import statTreesImg from '@/assets/stat-trees-grown.png';
import statAdsImg from '@/assets/stat-ads-watched.png';

export default function Profile() {
  const { userData } = useGarden();
  const telegram = useTelegram();
  const navigate = useNavigate();
  const isAdmin = telegram.id === ADMIN_TELEGRAM_ID;

  const treesGrown = userData.stats.totalTreesGrown;
  const referralCount = userData.referral.referredUsers.length;
  const paymentLevel = getPaymentLevel(treesGrown, referralCount);
  const referralLevel = getReferralLevel(referralCount);

  const photoUrl = telegram.photoUrl || (window.Telegram?.WebApp?.initDataUnsafe as any)?.user?.photo_url || null;

  return (
    <div className="px-4 py-3 pb-28" style={{ background: 'linear-gradient(180deg, hsl(20 30% 96%) 0%, hsl(15 20% 93%) 100%)', minHeight: '100vh' }}>
      <h1 className="text-xl font-bold text-foreground mb-5">👤 Profil</h1>

      {/* User card */}
      <div className="card-flat p-5 mb-5">
        <div className="flex flex-col items-center mb-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profil"
              className="w-20 h-20 rounded-full object-cover mb-2"
              style={{ border: '3px solid hsl(0 75% 50% / 0.2)' }}
              width={80}
              height={80}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
              style={{ background: 'hsl(0 75% 50% / 0.1)', border: '3px solid hsl(0 75% 50% / 0.2)' }}
            >
              <span className="text-4xl">🧑‍🌾</span>
            </div>
          )}
          <h2 className="font-bold text-card-foreground text-lg">{telegram.firstName}</h2>
          <p className="text-sm text-muted-foreground">@{telegram.username}</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">ID: {telegram.id}</p>
        </div>

        {/* Payment and Referral tiers side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ background: `${paymentLevel.color}10` }}>
            <img src={paymentLevel.image} alt={paymentLevel.name} className="w-10 h-10 mx-auto object-contain mb-1" width={40} height={40} loading="lazy" />
            <p className="text-xs font-bold text-card-foreground">{paymentLevel.name}</p>
            <p className="text-[10px] text-muted-foreground">To'lov darajasi</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: `${referralLevel.color}10` }}>
            <img src={referralLevel.image} alt={referralLevel.name} className="w-10 h-10 mx-auto object-contain mb-1" width={40} height={40} loading="lazy" />
            <p className="text-xs font-bold text-card-foreground">{referralLevel.name}</p>
            <p className="text-[10px] text-muted-foreground">Referal darajasi</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <h3 className="text-sm font-bold text-muted-foreground mb-3 px-1">📊 Statistika</h3>
      <div className="space-y-2.5">
        {/* Trees grown */}
        <div className="card-flat p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'hsl(145 40% 45% / 0.1)' }}>
              <img src={statTreesImg} alt="Daraxtlar" className="w-9 h-9 object-contain" width={36} height={36} loading="lazy" />
            </div>
            <span className="text-sm text-card-foreground">O'stirib tugatgan daraxtlar</span>
          </div>
          <span className="text-lg font-bold text-card-foreground tabular-nums">{treesGrown}</span>
        </div>

        {/* Fruits — individual */}
        <div className="card-flat p-4">
          <p className="text-sm text-card-foreground mb-2">Yig'ilgan mevalar</p>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center rounded-lg py-2" style={{ background: 'hsl(0 65% 50% / 0.08)' }}>
              <p className="text-lg">🍎</p>
              <p className="text-xs font-bold text-card-foreground">{userData.fruits.apple}</p>
              <p className="text-[9px] text-muted-foreground">Olma</p>
            </div>
            <div className="text-center rounded-lg py-2" style={{ background: 'hsl(85 50% 45% / 0.08)' }}>
              <p className="text-lg">🍐</p>
              <p className="text-xs font-bold text-card-foreground">{userData.fruits.pear}</p>
              <p className="text-[9px] text-muted-foreground">Nok</p>
            </div>
            <div className="text-center rounded-lg py-2" style={{ background: 'hsl(280 50% 45% / 0.08)' }}>
              <p className="text-lg">🍇</p>
              <p className="text-xs font-bold text-card-foreground">{userData.fruits.grape}</p>
              <p className="text-[9px] text-muted-foreground">Uzum</p>
            </div>
            <div className="text-center rounded-lg py-2" style={{ background: 'hsl(270 40% 50% / 0.08)' }}>
              <p className="text-lg">🫐</p>
              <p className="text-xs font-bold text-card-foreground">{userData.fruits.fig}</p>
              <p className="text-[9px] text-muted-foreground">Anjir</p>
            </div>
          </div>
        </div>

        {/* Ads watched */}
        <div className="card-flat p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'hsl(200 60% 50% / 0.1)' }}>
              <img src={statAdsImg} alt="Reklamalar" className="w-9 h-9 object-contain" width={36} height={36} loading="lazy" />
            </div>
            <span className="text-sm text-card-foreground">Jami ko'rilgan reklamalar</span>
          </div>
          <span className="text-lg font-bold text-card-foreground tabular-nums">{userData.stats.totalAdsWatched}</span>
        </div>
      </div>
    </div>
  );
}
