import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg?.initDataUnsafe?.user) {
      navigate('/', { replace: true });
    }
  }, [tg, navigate]);

  if (!tg?.initDataUnsafe?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center" style={{ background: 'linear-gradient(180deg, hsl(20 30% 96%) 0%, hsl(15 20% 93%) 100%)' }}>
        <div>
          <div className="text-6xl mb-4">🌱</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">BloomPay</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Bu ilova faqat Telegram orqali ishlaydi.
          </p>
          <a
            href="https://t.me/BloomPaybot"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm"
            style={{ background: 'linear-gradient(180deg, hsl(200 70% 50%) 0%, hsl(200 70% 40%) 100%)' }}
          >
            Telegram botni ochish
          </a>
        </div>
      </div>
    );
  }

  return null;
}
