-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL DEFAULT '',
  first_name TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  coins INTEGER NOT NULL DEFAULT 0,
  has_claimed_free_sapling BOOLEAN NOT NULL DEFAULT false,
  fruits_apple INTEGER NOT NULL DEFAULT 0,
  fruits_pear INTEGER NOT NULL DEFAULT 0,
  fruits_grape INTEGER NOT NULL DEFAULT 0,
  fruits_fig INTEGER NOT NULL DEFAULT 0,
  total_trees_grown INTEGER NOT NULL DEFAULT 0,
  total_fruits_harvested INTEGER NOT NULL DEFAULT 0,
  total_ads_watched INTEGER NOT NULL DEFAULT 0,
  ad_task_last_reset_date TEXT NOT NULL DEFAULT '',
  ad_task_ads_watched INTEGER NOT NULL DEFAULT 0,
  ad_task_total_ads_watched INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT NOT NULL DEFAULT '',
  referred_by TEXT,
  referral_earnings INTEGER NOT NULL DEFAULT 0,
  phone TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trees table
CREATE TABLE IF NOT EXISTS public.trees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_telegram_id TEXT NOT NULL REFERENCES public.users(telegram_id) ON DELETE CASCADE,
  tree_type TEXT NOT NULL DEFAULT 'apple',
  planted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  waterings_completed INTEGER NOT NULL DEFAULT 0,
  last_watered_at TIMESTAMP WITH TIME ZONE,
  harvested BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_telegram_id TEXT NOT NULL,
  referred_telegram_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel_tasks_completed table
CREATE TABLE IF NOT EXISTS public.channel_tasks_completed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_telegram_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_telegram_id, channel_id)
);

-- Create payment_requests table
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_telegram_id TEXT NOT NULL,
  username TEXT NOT NULL DEFAULT '',
  first_name TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  amount INTEGER NOT NULL,
  amount_uzs INTEGER NOT NULL DEFAULT 0,
  phone TEXT NOT NULL DEFAULT '',
  card_number TEXT NOT NULL DEFAULT '',
  card_last4 TEXT NOT NULL DEFAULT '',
  payment_level_id INTEGER NOT NULL DEFAULT 1,
  payment_level_name TEXT NOT NULL DEFAULT 'Sprout',
  rejection_reason TEXT,
  expected_date TEXT,
  paid_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel_tasks table
CREATE TABLE IF NOT EXISTS public.channel_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT NOT NULL DEFAULT '',
  reward INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create telegram_user_states table
CREATE TABLE IF NOT EXISTS public.telegram_user_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL DEFAULT '',
  first_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  step TEXT NOT NULL DEFAULT 'welcome',
  referral_code TEXT,
  terms_accepted_at TIMESTAMPTZ,
  channel_verified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trees_user ON public.trees(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_telegram_id);
CREATE INDEX IF NOT EXISTS idx_channel_tasks_user ON public.channel_tasks_completed(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON public.payment_requests(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_tasks_completed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_user_states ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read/write (telegram app, no auth.uid)
CREATE POLICY "Anyone can read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON public.users FOR UPDATE USING (true);

-- Trees: anyone can read/write
CREATE POLICY "Anyone can read trees" ON public.trees FOR SELECT USING (true);
CREATE POLICY "Anyone can insert trees" ON public.trees FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update trees" ON public.trees FOR UPDATE USING (true);

-- Referrals: anyone can read/write
CREATE POLICY "Anyone can read referrals" ON public.referrals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);

-- Channel tasks completed: anyone can read/write
CREATE POLICY "Anyone can read channel_tasks_completed" ON public.channel_tasks_completed FOR SELECT USING (true);
CREATE POLICY "Anyone can insert channel_tasks_completed" ON public.channel_tasks_completed FOR INSERT WITH CHECK (true);

-- Payment requests: anyone can read/write
CREATE POLICY "Anyone can read payments" ON public.payment_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert payments" ON public.payment_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payments" ON public.payment_requests FOR UPDATE USING (true);

-- Channel tasks: anyone can read/insert/update/delete
CREATE POLICY "Anyone can read active channel tasks" ON public.channel_tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert channel tasks" ON public.channel_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update channel tasks" ON public.channel_tasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete channel tasks" ON public.channel_tasks FOR DELETE USING (true);

-- Telegram user states: service role only
CREATE POLICY "Service role manages telegram states" ON public.telegram_user_states FOR ALL USING (true);

-- Admin stats function
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  today_date DATE := (now() AT TIME ZONE 'Asia/Tashkent')::date;
BEGIN
  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM public.users),
    'todayNewUsers', (SELECT COUNT(*) FROM public.users WHERE created_at::date = today_date),
    'totalAdsWatched', (SELECT COALESCE(SUM(total_ads_watched), 0) FROM public.users),
    'todayAdsWatched', (SELECT COALESCE(SUM(
      CASE WHEN ad_task_last_reset_date = to_char(today_date, 'YYYY-MM-DD') THEN ad_task_ads_watched ELSE 0 END
    ), 0) FROM public.users),
    'totalTrees', (SELECT COUNT(*) FROM public.trees),
    'totalFruits', json_build_object(
      'apple', (SELECT COALESCE(SUM(fruits_apple), 0) FROM public.users),
      'pear', (SELECT COALESCE(SUM(fruits_pear), 0) FROM public.users),
      'grape', (SELECT COALESCE(SUM(fruits_grape), 0) FROM public.users),
      'fig', (SELECT COALESCE(SUM(fruits_fig), 0) FROM public.users)
    ),
    'totalPaidAmount', (SELECT COALESCE(SUM(amount), 0) FROM public.payment_requests WHERE status = 'paid'),
    'totalPaidAmountUzs', (SELECT COALESCE(SUM(amount_uzs), 0) FROM public.payment_requests WHERE status = 'paid'),
    'pendingRequests', (SELECT COUNT(*) FROM public.payment_requests WHERE status = 'pending')
  ) INTO result;
  RETURN result;
END;
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON public.payment_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();