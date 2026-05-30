-- Fix bot duel notifications failing with FK violation
-- Bots (00000000-...) exist in public_profiles but not in profiles (auth table).
-- Trigger notify_duel_challenge_sent tried to INSERT notification with
-- recipient_id = opponent_id (bot) → FK violation on notifications_recipient_id_fkey.
-- Fix: skip notification when recipient is not a real auth user.

CREATE OR REPLACE FUNCTION public.notify_duel_challenge_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_challenger_nick text;
BEGIN
  -- Skip bots (not present in auth-linked profiles table)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.opponent_id) THEN
    RETURN NEW;
  END IF;
  SELECT nickname INTO v_challenger_nick FROM public.public_profiles WHERE id = NEW.challenger_id;
  INSERT INTO public.notifications (recipient_id, actor_id, type, content, message)
  VALUES (
    NEW.opponent_id,
    NEW.challenger_id,
    'duel_challenge',
    v_challenger_nick || ' đã thách đấu bạn! (mục tiêu ' || NEW.target_ml || 'ml)',
    v_challenger_nick || ' đã thách đấu bạn! (mục tiêu ' || NEW.target_ml || 'ml)'
  );
  RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION public.notify_duel_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_opponent_nick text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.challenger_id) THEN
    RETURN NEW;
  END IF;
  SELECT nickname INTO v_opponent_nick FROM public.public_profiles WHERE id = NEW.opponent_id;
  INSERT INTO public.notifications (recipient_id, actor_id, type, content, message)
  VALUES (
    NEW.challenger_id,
    NEW.opponent_id,
    'duel_accepted',
    v_opponent_nick || ' đã chấp nhận lời thách đấu! Hãy uống nước để chiến thắng!',
    v_opponent_nick || ' đã chấp nhận lời thách đấu! Hãy uống nước để chiến thắng!'
  );
  RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION public.notify_duel_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_winner_nick text;
  v_loser_id uuid;
BEGIN
  IF NEW.winner_id IS NOT NULL THEN
    SELECT nickname INTO v_winner_nick FROM public.public_profiles WHERE id = NEW.winner_id;
    v_loser_id := CASE WHEN NEW.challenger_id = NEW.winner_id THEN NEW.opponent_id ELSE NEW.challenger_id END;

    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.winner_id) THEN
      INSERT INTO public.notifications (recipient_id, type, content, message)
      VALUES (NEW.winner_id, 'duel_result', 'Bạn đã chiến thắng! +' || NEW.stake_coins || ' xu, +5 WP', 'Bạn đã chiến thắng! +' || NEW.stake_coins || ' xu, +5 WP');
    END IF;
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_loser_id) THEN
      INSERT INTO public.notifications (recipient_id, type, content, message)
      VALUES (v_loser_id, 'duel_result', 'Bạn đã thua trước ' || v_winner_nick || '. Cố gắng lần sau!', 'Bạn đã thua trước ' || v_winner_nick || '. Cố gắng lần sau!');
    END IF;
  ELSE
    INSERT INTO public.notifications (recipient_id, type, content, message)
    SELECT id, 'duel_result', 'Trận đấu kết thúc với tỷ số hòa! +' || NEW.stake_coins || ' xu', 'Trận đấu kết thúc với tỷ số hòa! +' || NEW.stake_coins || ' xu'
    FROM public.public_profiles
    WHERE id IN (NEW.challenger_id, NEW.opponent_id)
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = public.public_profiles.id);
  END IF;
  RETURN NEW;
END;
$func$;
