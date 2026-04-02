ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS referral_commission_carry integer NOT NULL DEFAULT 0;