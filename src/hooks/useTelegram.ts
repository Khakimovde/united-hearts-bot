import { useMemo } from 'react';

export interface TelegramUser {
  id: string;
  username: string;
  firstName: string;
  photoUrl: string | null;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
          };
        };
        themeParams: Record<string, string>;
        close: () => void;
      };
    };
  }
}

let telegramInitialized = false;

function initTelegram() {
  if (telegramInitialized) return;
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    telegramInitialized = true;
  }
}

export function useTelegram(): TelegramUser {
  return useMemo(() => {
    initTelegram();

    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (tgUser) {
      return {
        id: String(tgUser.id),
        username: tgUser.username || `user_${tgUser.id}`,
        firstName: tgUser.first_name || 'Foydalanuvchi',
        photoUrl: (tgUser as any).photo_url || null,
      };
    }

    return {
      id: 'dev_user_123',
      username: 'ishlab_chiquvchi',
      firstName: 'Mehmon',
      photoUrl: null,
    };
  }, []);
}
