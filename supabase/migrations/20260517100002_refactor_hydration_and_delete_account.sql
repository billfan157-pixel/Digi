-- 1. Helper function for WP calculation (replaces duplicated logic in process_hydration_event)
create or replace function public._calc_hydration_wp(
  p_intake int, p_goal int, p_log_count int,
  p_temp_c numeric, p_exercise_mins int, p_is_fasting boolean,
  p_streak_mult numeric, p_social_posts int, p_social_likes int
) returns int
language plpgsql
immutable
as $$
declare
  v_pct numeric;
  v_wp int;
begin
  v_pct := (p_intake::numeric / greatest(p_goal, 1)) * 100;

  if v_pct >= 100 then
    v_wp := 50;
  else
    v_wp := floor((v_pct / 100) * 30);
  end if;

  if v_pct > 100 then
    v_wp := v_wp + floor(least(v_pct - 100, 50) * 0.5);
  end if;

  if p_log_count >= 3 then
    v_wp := v_wp + least((p_log_count - 2) * 3, 30);
  end if;

  if p_temp_c is not null and v_pct >= 60 then
    if p_temp_c >= 32 then
      v_wp := v_wp + 15;
    elsif p_temp_c <= 15 then
      v_wp := v_wp + 10;
    end if;
  end if;

  if coalesce(p_exercise_mins, 0) >= 30 and v_pct >= 80 then
    v_wp := v_wp + 20;
  end if;

  if coalesce(p_is_fasting, false) and v_pct >= 80 then
    v_wp := v_wp + 15;
  end if;

  if p_social_posts > 0 then
    v_wp := v_wp + least(p_social_posts * 10, 30);
  end if;

  if p_social_likes > 0 then
    v_wp := v_wp + least(p_social_likes * 2, 20);
  end if;

  return floor(v_wp * p_streak_mult);
end;
$$;

-- 2. Refactored process_hydration_event (uses helper, eliminates WP calculation duplication)
create or replace function public.process_hydration_event(
  p_user_id uuid,
  p_amount_ml integer,
  p_temp_c numeric default null::numeric,
  p_exercise_mins integer default 0,
  p_is_fasting boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_profile record;
  v_old_intake int;
  v_new_intake int;
  v_goal int;
  v_streak int;
  v_log_count int;
  v_social_posts int;
  v_social_likes int;
  v_old_wp int := 0;
  v_new_wp int := 0;
  v_delta_wp int := 0;
  v_exp_gained int := 0;
  v_coins_gained int := 0;
  v_old_total_exp int := 0;
  v_new_total_exp int := 0;
  v_old_coins int := 0;
  v_new_coins int := 0;
  v_streak_mult numeric;
  v_new_level int := 1;
  v_remaining_exp int := 0;
  v_required_exp int := 0;
  v_rank_tier int := 1;
  i int;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  if p_amount_ml is null or p_amount_ml < 1 or p_amount_ml > 2000 then
    raise exception 'Invalid hydration amount' using errcode = '22023';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  v_old_intake := coalesce(v_profile.water_today, 0);
  v_new_intake := v_old_intake + p_amount_ml;
  v_goal := greatest(coalesce(v_profile.water_goal, 2000), 1);
  v_streak := coalesce(v_profile.current_streak, 0);
  v_old_total_exp := coalesce(v_profile.total_exp, 0);
  v_old_coins := coalesce(v_profile.coins, 0);

  select count(*) into v_log_count
  from public.water_logs
  where user_id = p_user_id
    and day = current_date;

  select count(*) into v_social_posts
  from public.social_posts
  where author_id = p_user_id
    and date(created_at) = current_date;

  select count(*) into v_social_likes
  from public.social_post_likes
  where user_id = p_user_id
    and date(created_at) = current_date;

  v_streak_mult := 1.0 + least(v_streak * 0.05, 1.5);

  -- WP calculation extracted to helper (eliminates 50 lines of duplicated logic)
  v_old_wp := public._calc_hydration_wp(
    v_old_intake, v_goal, greatest(v_log_count - 1, 0),
    p_temp_c, p_exercise_mins, p_is_fasting,
    v_streak_mult, v_social_posts, v_social_likes
  );

  v_new_wp := public._calc_hydration_wp(
    v_new_intake, v_goal, v_log_count,
    p_temp_c, p_exercise_mins, p_is_fasting,
    v_streak_mult, v_social_posts, v_social_likes
  );

  v_delta_wp := greatest(0, v_new_wp - v_old_wp);

  if coalesce(v_profile.level, 1) <= 10 then
    v_exp_gained := floor(p_amount_ml * 0.10);
  elsif coalesce(v_profile.level, 1) <= 20 then
    v_exp_gained := floor(p_amount_ml * 0.12);
  elsif coalesce(v_profile.level, 1) <= 30 then
    v_exp_gained := floor(p_amount_ml * 0.15);
  else
    v_exp_gained := floor(p_amount_ml * 0.20);
  end if;

  v_coins_gained := floor(v_exp_gained * 0.5);
  v_new_total_exp := v_old_total_exp + v_exp_gained;
  v_new_coins := v_old_coins + v_coins_gained;
  v_remaining_exp := v_new_total_exp;
  v_new_level := 1;

  for i in 1..99 loop
    if i <= 10 then
      v_required_exp := round((100 * power(i, 1.1)) / 10.0) * 10;
    elsif i <= 20 then
      v_required_exp := round((100 * power(i, 1.3)) / 10.0) * 10;
    elsif i <= 40 then
      v_required_exp := round((100 * power(i, 1.6)) / 10.0) * 10;
    else
      v_required_exp := round((100 * power(i, 2.0)) / 10.0) * 10;
    end if;

    exit when v_remaining_exp < v_required_exp;
    v_remaining_exp := v_remaining_exp - v_required_exp;
    v_new_level := i + 1;
  end loop;

  v_rank_tier := case
    when v_new_total_exp >= 220000 then 7
    when v_new_total_exp >= 116000 then 6
    when v_new_total_exp >= 56000 then 5
    when v_new_total_exp >= 25500 then 4
    when v_new_total_exp >= 9500 then 3
    when v_new_total_exp >= 2500 then 2
    else 1
  end;

  update public.profiles
  set water_today = v_new_intake,
      total_water = coalesce(total_water, 0) + p_amount_ml,
      wp = coalesce(wp, 0) + v_delta_wp,
      total_exp = v_new_total_exp,
      coins = v_new_coins,
      level = v_new_level,
      rank_tier = v_rank_tier
  where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'water_today', v_new_intake,
    'total_water', coalesce(v_profile.total_water, 0) + p_amount_ml,
    'wp_gained', v_delta_wp,
    'added_wp', v_delta_wp,
    'total_wp', coalesce(v_profile.wp, 0) + v_delta_wp,
    'current_streak', v_streak,
    'exp_gained', v_exp_gained,
    'added_exp', v_exp_gained,
    'total_exp', v_new_total_exp,
    'new_total_exp', v_new_total_exp,
    'coins_gained', v_coins_gained,
    'new_coins', v_coins_gained,
    'total_coins', v_new_coins,
    'new_level', v_new_level,
    'rank_tier', v_rank_tier
  );
end;
$$;

-- 3. Create delete_account_and_auth RPC
create or replace function public.delete_account_and_auth()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  delete from auth.users where id = auth.uid();

  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.delete_account_and_auth() from public;
grant execute on function public.delete_account_and_auth() to authenticated;
