REVOKE EXECUTE ON FUNCTION public.accept_battle(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.action_cheers_post(uuid, uuid, date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.disband_club(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_club_level(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_profile_stats(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.join_club(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.pulse_post(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.accept_battle(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.action_cheers_post(uuid, uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disband_club(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_level(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_club(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pulse_post(uuid) TO authenticated;