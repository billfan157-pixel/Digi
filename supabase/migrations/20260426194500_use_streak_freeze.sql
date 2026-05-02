create or replace function public.use_streak_freeze(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_goal integer;
  v_remaining_freezes integer;
  v_yesterday text := to_char(current_date - interval '1 day', 'YYYY-MM-DD');
  v_day_before text := to_char(current_date - interval '2 day', 'YYYY-MM-DD');
  v_yesterday_total integer := 0;
  v_day_before_total integer := 0;
  v_amount_to_add integer := 0;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  select
    greatest(coalesce(water_goal, 2000), 1),
    coalesce(streak_freezes, 0)
  into
    v_goal,
    v_remaining_freezes
  from public.profiles
  where id = p_user_id
  for update;

  if v_goal is null then
    raise exception 'Profile not found';
  end if;

  if v_remaining_freezes <= 0 then
    raise exception 'No streak freezes available';
  end if;

  select coalesce(sum(amount), 0)::integer
  into v_yesterday_total
  from public.water_logs
  where user_id = p_user_id
    and day::text = v_yesterday;

  select coalesce(sum(amount), 0)::integer
  into v_day_before_total
  from public.water_logs
  where user_id = p_user_id
    and day::text = v_day_before;

  if v_yesterday_total >= v_goal then
    raise exception 'Previous day already met the hydration goal';
  end if;

  if v_day_before_total < v_goal then
    raise exception 'No active streak to preserve';
  end if;

  v_amount_to_add := greatest(v_goal - v_yesterday_total, 0);
  if v_amount_to_add <= 0 then
    raise exception 'No hydration top-up required';
  end if;

  insert into public.water_logs (user_id, amount, name, exp, day, created_at)
  values (p_user_id, v_amount_to_add, 'Streak Freeze', 0, v_yesterday, now());

  update public.profiles
  set
    streak_freezes = greatest(coalesce(streak_freezes, 0) - 1, 0),
    updated_at = now()
  where id = p_user_id
  returning streak_freezes into v_remaining_freezes;

  return jsonb_build_object(
    'used_day', v_yesterday,
    'amount_added', v_amount_to_add,
    'remaining_freezes', v_remaining_freezes
  );
end;
$$;

grant execute on function public.use_streak_freeze(uuid) to authenticated;
