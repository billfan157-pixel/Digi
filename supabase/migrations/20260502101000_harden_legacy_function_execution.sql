do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (array[
        'action_cheers_post',
        'award_exp_and_rank',
        'calculate_level_from_exp',
        'get_club_level',
        'handle_club_creation_fee',
        'handle_new_club_owner',
        'handle_new_club_setup',
        'handle_new_user',
        'increment_club_water',
        'join_challenge',
        'log_water_and_update_streak',
        'manual_sync_water_data',
        'notify_on_comment',
        'notify_on_follow',
        'notify_on_like_post',
        'pulse_post',
        'recalculate_user_level',
        'recalculate_user_total_exp',
        'resolve_stale_battle',
        'rls_auto_enable',
        'some_trigger_function',
        'sync_club_daily_stats',
        'sync_logs_to_profile',
        'sync_water_to_profile',
        'trigger_recalculate_total_exp',
        'update_club_member_count',
        'update_club_stats',
        'update_post_like_count',
        'update_updated_at_column',
        'use_streak_freeze'
      ])
  loop
    execute format('alter function %s set search_path = pg_catalog, public', r.signature);
  end loop;

  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (array[
        'handle_club_creation_fee',
        'handle_new_club_owner',
        'handle_new_club_setup',
        'handle_new_user',
        'notify_on_comment',
        'notify_on_follow',
        'notify_on_like_post',
        'rls_auto_enable',
        'some_trigger_function',
        'sync_club_daily_stats',
        'sync_logs_to_profile',
        'sync_water_to_profile',
        'trigger_recalculate_total_exp',
        'update_club_member_count',
        'update_club_stats',
        'update_post_like_count',
        'update_updated_at_column'
      ])
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.signature);
  end loop;
end;
$$;
