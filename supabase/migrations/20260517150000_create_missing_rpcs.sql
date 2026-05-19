-- Create drop_water_to_post function (was missing, called by useFeedInteractions)
CREATE OR REPLACE FUNCTION public.drop_water_to_post(
  p_post_id uuid,
  p_from_user uuid,
  p_to_user uuid,
  p_amount integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cheerer_id uuid := auth.uid();
BEGIN
  IF v_cheerer_id IS NULL OR v_cheerer_id <> p_from_user THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET water_today = GREATEST(0, water_today - p_amount)
  WHERE id = p_from_user;

  INSERT INTO public.notifications (recipient_id, actor_id, type, content, reference_id, reference_type)
  VALUES (p_to_user, p_from_user, 'water_drop', p_amount || 'ml nước đã được châm cho bạn!', p_post_id, 'social_post');

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.drop_water_to_post(uuid, uuid, uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.drop_water_to_post(uuid, uuid, uuid, integer) TO authenticated, service_role;

-- Create increment_club_member_intake as wrapper for increment_club_water
-- (frontend calls increment_club_member_intake, but DB had increment_club_water)
CREATE OR REPLACE FUNCTION public.increment_club_member_intake(
  p_user_id uuid,
  p_club_id uuid,
  p_amount_to_add integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.increment_club_water(p_club_id, p_user_id, p_amount_to_add);
END;
$function$;

REVOKE ALL ON FUNCTION public.increment_club_member_intake(uuid, uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.increment_club_member_intake(uuid, uuid, integer) TO authenticated, service_role;
