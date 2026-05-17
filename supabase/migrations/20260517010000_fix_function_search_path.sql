-- Migration: Fix function search_path for pulse_post and get_club_level
-- Issue: Functions without set search_path are vulnerable to search path injection

CREATE OR REPLACE FUNCTION public.pulse_post(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_club_level(p_club_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_exp integer;
BEGIN
    SELECT COALESCE(SUM(p.exp), 0) INTO total_exp
    FROM public.club_members cm
    JOIN public.profiles p ON cm.user_id = p.id
    WHERE cm.club_id = p_club_id;

    RETURN FLOOR(1 + SQRT(total_exp / 500));
END;
$$;
