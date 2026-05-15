-- 1. Atomic Join Club RPC
create or replace function public.join_club(p_user_id uuid, p_club_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ensure user is authenticated and is the one joining
  if auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  -- Leave current clubs
  delete from public.club_members
  where user_id = p_user_id;

  -- Join new club
  insert into public.club_members (user_id, club_id, role)
  values (p_user_id, p_club_id, 'member');
end;
$$;

-- 2. Atomic Accept Battle RPC
create or replace function public.accept_battle(p_user_id uuid, p_battle_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ensure user is authenticated and is the opponent
  if not exists (
    select 1 from public.hydration_battles 
    where id = p_battle_id and opponent_id = p_user_id and status = 'pending'
  ) then
    raise exception 'Unauthorized or battle not pending';
  end if;

  -- 1. Activate this battle
  update public.hydration_battles
  set status = 'active',
      updated_at = now()
  where id = p_battle_id;

  -- 2. Decline other pending invites for this user
  update public.hydration_battles
  set status = 'declined',
      updated_at = now()
  where opponent_id = p_user_id
    and status = 'pending'
    and id <> p_battle_id;
end;
$$;

-- 3. Performance: pg_trgm for efficient partial nickname search
create extension if not exists pg_trgm;

-- 4. Performance: GIN index for nickname (only if public_profiles table exists)
-- Note: This is disabled as the table is 'profiles' not 'public_profiles'
-- create index if not exists idx_profiles_nickname_trgm on public.public_profiles using gin (nickname gin_trgm_ops);

-- 5. Consolidated Profile Stats RPC
create or replace function public.get_profile_stats(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_follower_count int;
  v_following_count int;
  v_post_count int;
begin
  select count(*) into v_follower_count from public.social_follows where following_id = p_user_id;
  select count(*) into v_following_count from public.social_follows where follower_id = p_user_id;
  select count(*) into v_post_count from public.social_posts where author_id = p_user_id;

  return jsonb_build_object(
    'follower_count', v_follower_count,
    'following_count', v_following_count,
    'post_count', v_post_count
  );
end;
$$;

-- Grant execute permissions
grant execute on function public.join_club(uuid, uuid) to authenticated;
grant execute on function public.accept_battle(uuid, uuid) to authenticated;
grant execute on function public.get_profile_stats(uuid) to authenticated;
