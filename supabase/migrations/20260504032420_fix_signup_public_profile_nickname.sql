alter table public.public_profiles
  alter column nickname set default 'Người dùng DigiWell';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nickname', ''), 'Người dùng DigiWell')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

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
    coalesce(nullif(new.nickname, ''), 'Người dùng DigiWell'),
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
    nickname = coalesce(nullif(excluded.nickname, ''), public.public_profiles.nickname, 'Người dùng DigiWell'),
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

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function private.sync_public_profile() from public, anon, authenticated;
