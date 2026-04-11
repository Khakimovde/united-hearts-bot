ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tickets_yellow integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tickets_green integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tickets_red integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lottery_ads_watched integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lottery_ads_reset_at timestamp with time zone DEFAULT now();