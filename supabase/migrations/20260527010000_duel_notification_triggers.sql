-- Duel (hydration_battles) notification triggers

-- Notify opponent when a duel challenge is sent
CREATE OR REPLACE FUNCTION public.notify_duel_challenge_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_challenger_nick text;
BEGIN
  SELECT nickname INTO v_challenger_nick FROM public.public_profiles WHERE id = NEW.challenger_id;
  INSERT INTO public.notifications (recipient_id, actor_id, type, message)
  VALUES (
    NEW.opponent_id,
    NEW.challenger_id,
    'duel_challenge',
    v_challenger_nick || ' đã thách đấu bạn! (mục tiêu ' || NEW.target_ml || 'ml)'
  );
  RETURN NEW;
END;
$func$;

-- Notify challenger when duel is accepted
CREATE OR REPLACE FUNCTION public.notify_duel_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_opponent_nick text;
BEGIN
  SELECT nickname INTO v_opponent_nick FROM public.public_profiles WHERE id = NEW.opponent_id;
  INSERT INTO public.notifications (recipient_id, actor_id, type, message)
  VALUES (
    NEW.challenger_id,
    NEW.opponent_id,
    'duel_accepted',
    v_opponent_nick || ' đã chấp nhận lời thách đấu! Hãy uống nước để chiến thắng!'
  );
  RETURN NEW;
END;
$func$;

-- Notify both participants when duel is completed
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

    INSERT INTO public.notifications (recipient_id, type, message)
    VALUES
      (NEW.winner_id, 'duel_result', 'Bạn đã chiến thắng! +' || NEW.stake_coins || ' xu, +5 WP'),
      (v_loser_id, 'duel_result', 'Bạn đã thua trước ' || v_winner_nick || '. Cố gắng lần sau!');
  ELSE
    INSERT INTO public.notifications (recipient_id, type, message)
    SELECT id, 'duel_result', 'Trận đấu kết thúc với tỷ số hòa! +' || NEW.stake_coins || ' xu'
    FROM public.public_profiles
    WHERE id IN (NEW.challenger_id, NEW.opponent_id);
  END IF;
  RETURN NEW;
END;
$func$;

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trg_notify_duel_challenge_sent ON public.hydration_battles;
DROP TRIGGER IF EXISTS trg_notify_duel_accepted ON public.hydration_battles;
DROP TRIGGER IF EXISTS trg_notify_duel_completed ON public.hydration_battles;

CREATE TRIGGER trg_notify_duel_challenge_sent
  AFTER INSERT ON public.hydration_battles
  FOR EACH ROW EXECUTE FUNCTION public.notify_duel_challenge_sent();

CREATE TRIGGER trg_notify_duel_accepted
  AFTER UPDATE OF status ON public.hydration_battles
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'active')
  EXECUTE FUNCTION public.notify_duel_accepted();

CREATE TRIGGER trg_notify_duel_completed
  AFTER UPDATE OF status ON public.hydration_battles
  FOR EACH ROW
  WHEN (OLD.status = 'active' AND NEW.status = 'completed')
  EXECUTE FUNCTION public.notify_duel_completed();
