-- Fix B1a/B10: accept_battle — add auth.uid() check + FOR UPDATE lock
create or replace function public.accept_battle(p_user_id uuid, p_battle_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  if not exists (
    select 1 from public.hydration_battles 
    where id = p_battle_id and opponent_id = p_user_id and status = 'pending'
    for update
  ) then
    raise exception 'Unauthorized or battle not pending';
  end if;

  update public.hydration_battles
  set status = 'active',
      updated_at = now()
  where id = p_battle_id;

  update public.hydration_battles
  set status = 'declined',
      updated_at = now()
  where opponent_id = p_user_id
    and status = 'pending'
    and id <> p_battle_id;
end;
$$;

-- Fix B1b: get_profile_stats — add auth.uid() check
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
  if auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;

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
