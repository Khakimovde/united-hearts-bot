import { useEffect, useState, useCallback } from 'react';
import { useGarden } from '@/contexts/GardenContext';
import { showNextAd } from '@/lib/adManager';

export function AdModal() {
  const { showingAd, completeAd, adCount } = useGarden();
  const [adsWatched, setAdsWatched] = useState(0);
  const [watching, setWatching] = useState(false);
  const totalRequired = adCount;

  useEffect(() => {
    if (!showingAd) {
      setAdsWatched(0);
      setWatching(false);
    }
  }, [showingAd]);

  // Auto-start first ad when modal opens
  useEffect(() => {
    if (showingAd && adsWatched === 0 && !watching) {
      watchOne();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showingAd]);

  const watchOne = useCallback(async () => {
    if (watching) return;
    setWatching(true);
    try {
      await showNextAd();
    } catch {
      // continue even if ad fails
    }
    const newCount = adsWatched + 1;
    setAdsWatched(newCount);
    setWatching(false);

    if (newCount >= totalRequired) {
      setTimeout(() => completeAd(), 300);
    }
  }, [watching, adsWatched, totalRequired, completeAd]);

  if (!showingAd) return null;

  const done = adsWatched >= totalRequired;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm">
      <div className="bg-card rounded-3xl p-8 mx-6 text-center max-w-sm w-full shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="text-3xl">📺</span>
        </div>
        <h3 className="text-lg font-semibold text-card-foreground mb-1">
          Reklama ko'rish
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {done
            ? "Barcha reklamalar ko'rildi! ✅"
            : totalRequired === 1
              ? "Reklama ko'rilmoqda..."
              : `${totalRequired} ta reklama ko'ring`
          }
        </p>

        {/* Progress - only show dots for multi-ad */}
        {totalRequired > 1 && (
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {Array.from({ length: totalRequired }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  background: i < adsWatched
                    ? 'linear-gradient(135deg, hsl(145 50% 45%), hsl(145 60% 55%))'
                    : i === adsWatched && watching
                      ? 'hsl(38 80% 52%)'
                      : 'hsl(0 0% 90%)',
                  color: i < adsWatched || (i === adsWatched && watching) ? 'white' : 'hsl(0 0% 60%)',
                }}
              >
                {i < adsWatched ? '✓' : i + 1}
              </div>
            ))}
          </div>
        )}

        {totalRequired > 1 && (
          <p className="text-sm font-bold mb-4" style={{ color: 'hsl(0 75% 50%)' }}>
            {adsWatched}/{totalRequired}
          </p>
        )}

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(adsWatched / totalRequired) * 100}%`,
              background: 'linear-gradient(90deg, hsl(0 80% 58%), hsl(38 85% 52%))',
            }}
          />
        </div>

        {!done && !watching && adsWatched > 0 && totalRequired > 1 && (
          <button
            onClick={watchOne}
            className="btn-cartoon px-6 py-3 text-sm"
          >
            📺 {adsWatched + 1}-reklama ko'rish
          </button>
        )}

        {watching && (
          <p className="text-xs text-muted-foreground animate-pulse">
            ⏳ Reklama ko'rilmoqda...
          </p>
        )}
      </div>
    </div>
  );
}