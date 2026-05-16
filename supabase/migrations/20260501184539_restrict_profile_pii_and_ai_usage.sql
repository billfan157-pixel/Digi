create schema if not exists private;

create table if not exists public.public_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  nickname varchar not null,
  avatar_url text,
  level integer,
  wp integer,
  total_wp integer,
  water_today integer,
  water_goal numeric,
  user_title text,
  updated_at timestamp without time zone
);

alter table public.public_profiles enable row level security;

drop policy if exists public_profiles_select_authenticated on public.public_profiles;
create policy public_profiles_select_authenticated
on public.public_profiles
for select
to authenticated
using (true);

revoke all on public.public_profiles from public, anon;
grant select on public.public_profiles to authenticated;

insert into public.public_profiles (
  id,
  nickname,
  avatar_url,
  level,
  wp,
  total_wp,
  water_today,
  water_goal,
  user_title,
  updated_at
)
select
  id,
  nickname,
  avatar_url,
  level,
  wp,
  total_wp,
  water_today,
  water_goal,
  user_title,
  updated_at
from public.profiles
on conflict (id) do update set
  nickname = excluded.nickname,
  avatar_url = excluded.avatar_url,
  level = excluded.level,
  wp = excluded.wp,
  total_wp = excluded.total_wp,
  water_today = excluded.water_today,
  water_goal = excluded.water_goal,
  user_title = excluded.user_title,
  updated_at = excluded.updated_at;

create or replace function private.sync_public_profile()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.public_profiles (
    id,
    nickname,
    avatar_url,
    level,
    wp,
    total_wp,
    water_today,
    water_goal,
    user_title,
    updated_at
  )
  values (
    new.id,
    new.nickname,
    new.avatar_url,
    new.level,
    new.wp,
    new.total_wp,
    new.water_today,
    new.water_goal,
    new.user_title,
    new.updated_at
  )
  on conflict (id) do update set
    nickname = excluded.nickname,
    avatar_url = excluded.avatar_url,
    level = excluded.level,
    wp = excluded.wp,
    total_wp = excluded.total_wp,
    water_today = excluded.water_today,
    water_goal = excluded.water_goal,
    user_title = excluded.user_title,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function private.sync_public_profile() from public, anon, authenticated;

drop trigger if exists sync_public_profile_after_profile_write on public.profiles;
create trigger sync_public_profile_after_profile_write
after insert or update of nickname, avatar_url, level, wp, total_wp, water_today, water_goal, user_title, updated_at
on public.profiles
for each row
execute function private.sync_public_profile();

alter table public.social_posts
  drop constraint if exists social_posts_author_public_profile_fkey,
  add constraint social_posts_author_public_profile_fkey
    foreign key (author_id) references public.public_profiles(id) on delete cascade;

alter table public.hydration_battles
  drop constraint if exists hydration_battles_challenger_public_profile_fkey,
  add constraint hydration_battles_challenger_public_profile_fkey
    foreign key (challenger_id) references public.public_profiles(id) on delete cascade,
  drop constraint if exists hydration_battles_opponent_public_profile_fkey,
  add constraint hydration_battles_opponent_public_profile_fkey
    foreign key (opponent_id) references public.public_profiles(id) on delete cascade;

alter table public.notifications
  drop constraint if exists notifications_actor_public_profile_fkey,
  add constraint notifications_actor_public_profile_fkey
    foreign key (actor_id) references public.public_profiles(id) on delete cascade;

drop policy if exists "Profiles are public" on public.profiles;

create or replace function public.consume_ai_usage(p_action text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_column text;
  v_limit integer;
  v_current integer;
  v_is_premium boolean;
begin
  if v_user_id is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  v_column := case p_action
    when 'chat' then 'message_count'
    when 'advice' then 'advice_count'
    when 'insight' then 'advice_count'
    when 'report-analysis' then 'advice_count'
    when 'scan' then 'scan_count'
    else null
  end;

  if v_column is null then
    raise exception 'Unsupported AI action' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.profiles
    where id = v_user_id
      and subscription_tier = 'premium'
      and (subscription_end is null or subscription_end > now())
  )
  into v_is_premium;

  v_limit := case
    when v_is_premium then 1000000
    when v_column = 'message_count' then 5
    when v_column = 'advice_count' then 3
    when v_column = 'scan_count' then 1
    else 0
  end;

  insert into public.ai_usage (user_id, date)
  values (v_user_id, current_date)
  on conflict (user_id, date) do nothing;

  execute format(
    'select %I from public.ai_usage where user_id = $1 and date = current_date for update',
    v_column
  )
  into v_current
  using v_user_id;

  if coalesce(v_current, 0) >= v_limit then
    return jsonb_build_object(
      'allowed', false,
      'limit', v_limit,
      'remaining', 0
    );
  end if;

  execute format(
    'update public.ai_usage set %I = %I + 1 where user_id = $1 and date = current_date',
    v_column,
    v_column
  )
  using v_user_id;

  return jsonb_build_object(
    'allowed', true,
    'limit', v_limit,
    'remaining', greatest(v_limit - coalesce(v_current, 0) - 1, 0)
  );
end;
$$;

revoke all on function public.consume_ai_usage(text) from public, anon;
grant execute on function public.consume_ai_usage(text) to authenticated;