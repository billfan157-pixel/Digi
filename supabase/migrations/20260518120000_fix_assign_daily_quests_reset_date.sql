-- Fix assign_daily_quests to set reset_date = current_date
-- and use ON CONFLICT to prevent duplicate key violations.
-- 
-- Root cause: The INSERT previously omitted reset_date (defaulting to NULL),
-- but there is a UNIQUE NULLS NOT DISTINCT (user_id, quest_id, reset_date)
-- constraint. Level-up quests already have rows with (user_id, quest_id, NULL),
-- so daily quest inserts collided with them.

CREATE OR REPLACE FUNCTION public.assign_daily_quests(p_user_id uuid)
RETURNS TABLE(assigned_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_daily_quests_today_count integer;
  v_newly_assigned_count integer := 0;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select count(*)
  into v_daily_quests_today_count
  from public.user_quests uq
  join public.quests q on uq.quest_id = q.id
  where uq.user_id = p_user_id
    and q.quest_type = 'daily'
    and uq.assigned_date = current_date;

  if v_daily_quests_today_count > 0 then
    return query select 0, 'Nhiệm vụ hàng ngày đã được giao hôm nay.'::text;
    return;
  end if;

  insert into public.user_quests (user_id, quest_id, reset_date, expires_at, assigned_date)
  select
    p_user_id,
    q.id,
    current_date,
    current_date + time '23:59:59',
    current_date
  from public.quests q
  where q.quest_type = 'daily'
  on conflict (user_id, quest_id, reset_date) do nothing;

  get diagnostics v_newly_assigned_count = row_count;

  return query select v_newly_assigned_count, ('Đã gán thành công ' || v_newly_assigned_count || ' nhiệm vụ.')::text;
end;
$function$;

REVOKE ALL ON FUNCTION public.assign_daily_quests(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.assign_daily_quests(uuid) TO authenticated, service_role;
