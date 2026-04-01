
-- Delete all payment_requests
DELETE FROM public.payment_requests;

-- Delete referrals for non-admin users
DELETE FROM public.referrals WHERE referrer_telegram_id != '5326022510' AND referred_telegram_id != '5326022510';

-- Delete trees for non-admin users
DELETE FROM public.trees WHERE user_telegram_id != '5326022510';

-- Delete channel_tasks_completed for non-admin users
DELETE FROM public.channel_tasks_completed WHERE user_telegram_id != '5326022510';

-- Delete telegram_user_states for non-admin users
DELETE FROM public.telegram_user_states WHERE telegram_id != '5326022510';

-- Delete non-admin users
DELETE FROM public.users WHERE telegram_id != '5326022510';
