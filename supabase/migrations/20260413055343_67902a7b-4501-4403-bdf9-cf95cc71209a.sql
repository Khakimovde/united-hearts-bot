ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS green_tickets_claimed integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS red_tickets_claimed integer NOT NULL DEFAULT 0;