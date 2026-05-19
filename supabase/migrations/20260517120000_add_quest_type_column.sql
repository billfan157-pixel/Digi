-- Add quest_type column to quests table (required by assign_daily_quests RPC)
-- The RPC references q.quest_type but the column was never added

ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS quest_type text NOT NULL DEFAULT 'daily';

-- Update existing quests to have proper type classification
UPDATE public.quests SET quest_type = 'daily' WHERE quest_type IS NULL;

-- Re-create the RPC now that the column exists
create or replace function public.assign_daily_quests(p_user_id uuid)
returns table(assigned_count integer, message text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
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

  insert into public.user_quests (user_id, quest_id, expires_at, assigned_date)
  select
    p_user_id,
    q.id,
    current_date + time '23:59:59',
    current_date
  from public.quests q
  where q.quest_type = 'daily';

  get diagnostics v_newly_assigned_count = row_count;

  return query select v_newly_assigned_count, ('Đã gán thành công ' || v_newly_assigned_count || ' nhiệm vụ.')::text;
end;
$$;

revoke all on function public.assign_daily_quests(uuid) from public, anon;
grant execute on function public.assign_daily_quests(uuid) to authenticated, service_role;
