
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'uzcard';

CREATE OR REPLACE FUNCTION public.submit_payment_request(
  p_user_telegram_id text,
  p_username text,
  p_first_name text,
  p_photo_url text,
  p_amount integer,
  p_amount_uzs integer,
  p_phone text,
  p_card_number text,
  p_card_last4 text,
  p_payment_level_id integer,
  p_payment_level_name text,
  p_expected_date text,
  p_payment_method text DEFAULT 'uzcard'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_payment_id uuid;
  v_remaining_coins integer;
BEGIN
  IF COALESCE(trim(p_user_telegram_id), '') = '' THEN
    RAISE EXCEPTION 'USER_REQUIRED';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  SELECT *
  INTO v_user
  FROM public.users
  WHERE telegram_id = p_user_telegram_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  IF v_user.coins < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_COINS';
  END IF;

  v_remaining_coins := v_user.coins - p_amount;

  UPDATE public.users
  SET coins = v_remaining_coins,
      updated_at = now()
  WHERE telegram_id = p_user_telegram_id;

  INSERT INTO public.payment_requests (
    user_telegram_id, username, first_name, photo_url,
    amount, amount_uzs, phone, card_number, card_last4,
    payment_level_id, payment_level_name, expected_date, payment_method
  )
  VALUES (
    p_user_telegram_id,
    COALESCE(p_username, ''),
    COALESCE(p_first_name, ''),
    p_photo_url,
    p_amount, p_amount_uzs,
    COALESCE(p_phone, ''),
    COALESCE(p_card_number, ''),
    COALESCE(p_card_last4, ''),
    COALESCE(p_payment_level_id, 1),
    COALESCE(p_payment_level_name, 'Sprout'),
    p_expected_date,
    COALESCE(p_payment_method, 'uzcard')
  )
  RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'remaining_coins', v_remaining_coins
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_payment_request(
  text, text, text, text, integer, integer, text, text, text, integer, text, text, text
) TO anon, authenticated, service_role;
