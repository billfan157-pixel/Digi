-- Add "message" column + fix trigger functions to use "content" (frontend reads "content")
-- Triggers in 20260527010000 and 20260526230000 used non-existent "message" column,
-- which broke start_bot_duel and any INSERT into hydration_battles/club_battles.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS message text;

-- ============================================================
-- Fix duel notification triggers: write to "content"
-- ============================================================

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
  -- Skip bots (opponent is the acceptor, always a real user; guard for safety)
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

    -- Only notify winner if a real user
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.winner_id) THEN
      INSERT INTO public.notifications (recipient_id, type, content, message)
      VALUES (NEW.winner_id, 'duel_result', 'Bạn đã chiến thắng! +' || NEW.stake_coins || ' xu, +5 WP', 'Bạn đã chiến thắng! +' || NEW.stake_coins || ' xu, +5 WP');
    END IF;
    -- Only notify loser if a real user
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

-- ============================================================
-- Fix club notification triggers: write to "content"
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_club_challenge_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_msg text;
BEGIN
  v_msg := 'Club ' || (SELECT name FROM public.clubs WHERE id = NEW.challenger_club_id) || ' đã thách đấu club của bạn!';
  INSERT INTO public.notifications (recipient_id, actor_id, type, content, message)
  SELECT club_members.user_id, NEW.created_by, 'club_challenge', v_msg, v_msg
  FROM public.club_members
  WHERE club_members.club_id = NEW.opponent_club_id
    AND club_members.role IN ('owner', 'deputy');
  RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION public.notify_club_battle_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_acceptor_id uuid;
  v_msg text;
BEGIN
  v_acceptor_id := auth.uid();
  v_msg := 'Trận chiến giữa ' || (SELECT name FROM public.clubs WHERE id = NEW.challenger_club_id)
    || ' và ' || (SELECT name FROM public.clubs WHERE id = NEW.opponent_club_id) || ' bắt đầu! Hãy đóng góp nước!';
  INSERT INTO public.notifications (recipient_id, actor_id, type, content, message)
  SELECT club_members.user_id, v_acceptor_id, 'club_battle_started', v_msg, v_msg
  FROM public.club_members
  WHERE club_members.club_id IN (NEW.challenger_club_id, NEW.opponent_club_id);
  RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION public.notify_club_battle_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_winner_name text;
  v_msg_win text;
  v_msg_lose text;
BEGIN
  SELECT name INTO v_winner_name FROM public.clubs WHERE id = NEW.winner_club_id;
  v_msg_win := 'Club của bạn đã chiến thắng trước ' || (SELECT name FROM public.clubs WHERE id = CASE WHEN NEW.winner_club_id = NEW.challenger_club_id THEN NEW.opponent_club_id ELSE NEW.challenger_club_id END) || '!';
  v_msg_lose := 'Club của bạn đã thua trước ' || v_winner_name || '. Cố gắng lần sau!';
  INSERT INTO public.notifications (recipient_id, type, content, message)
  SELECT club_members.user_id, 'club_battle_result',
    CASE WHEN club_members.club_id = NEW.winner_club_id THEN v_msg_win ELSE v_msg_lose END,
    CASE WHEN club_members.club_id = NEW.winner_club_id THEN v_msg_win ELSE v_msg_lose END
  FROM public.club_members
  WHERE club_members.club_id IN (NEW.challenger_club_id, NEW.opponent_club_id);
  RETURN NEW;
END;
$func$;
