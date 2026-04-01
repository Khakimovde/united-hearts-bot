// Ad Manager — alternates between Monetag and Onclicka
// Each watering/task requires watching ads, shown via these providers

const ONCLICKA_SPOT_ID = 6115463;

type AdProvider = 'monetag' | 'onclicka';

let currentProvider: AdProvider = 'monetag';
let onclickaShowFn: ((args?: any) => Promise<void>) | null = null;
let onclickaInitPromise: Promise<void> | null = null;

function initOnclicka(): Promise<void> {
  if (onclickaInitPromise) return onclickaInitPromise;
  onclickaInitPromise = new Promise<void>((resolve) => {
    const tryInit = () => {
      // @ts-expect-error admanager global
      if (window.initCdTma) {
        // @ts-expect-error admanager global
        window.initCdTma({ id: ONCLICKA_SPOT_ID })
          .then((show: any) => {
            onclickaShowFn = show;
            resolve();
          })
          .catch((e: any) => {
            console.log('Onclicka init error:', e);
            resolve(); // resolve anyway to not block
          });
      } else {
        setTimeout(tryInit, 500);
      }
    };
    tryInit();
  });
  return onclickaInitPromise;
}

// Initialize on load
if (typeof window !== 'undefined') {
  initOnclicka();
}

function showMonetagAd(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // @ts-expect-error monetag SDK global
      if (window.show_10813963) {
        // @ts-expect-error monetag SDK global
        window.show_10813963().then(() => resolve(true)).catch(() => resolve(false));
      } else {
        // Fallback — treat as shown after short delay
        setTimeout(() => resolve(true), 1500);
      }
    } catch {
      setTimeout(() => resolve(true), 1500);
    }
  });
}

function showOnclickaAd(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (onclickaShowFn) {
        onclickaShowFn()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      } else {
        // Fallback
        setTimeout(() => resolve(true), 1500);
      }
    } catch {
      setTimeout(() => resolve(true), 1500);
    }
  });
}

export async function showNextAd(): Promise<boolean> {
  const provider = currentProvider;
  // Alternate for next call
  currentProvider = currentProvider === 'monetag' ? 'onclicka' : 'monetag';

  if (provider === 'monetag') {
    return showMonetagAd();
  } else {
    await initOnclicka();
    return showOnclickaAd();
  }
}

export function getAdsRequiredPerWatering(): number {
  return 6;
}
