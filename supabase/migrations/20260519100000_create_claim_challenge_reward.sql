-- Add migration to track claim_challenge_reward in version control
-- Function already exists on remote, adding here for fresh deployments

create or replace function public.claim_challenge_reward(p_user_id uuid, p_user_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_challenge_status text;
  v_reward_exp integer;
  v_reward_coins integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select uc.status, ch.reward_exp, ch.reward_coins
  into v_challenge_status, v_reward_exp, v_reward_coins
  from public.user_challenges uc
  join public.challenges ch on ch.id = uc.challenge_id
  where uc.id = p_user_challenge_id
    and uc.user_id = p_user_id
  for update of uc;

  if not found then
    raise exception 'Challenge not found';
  end if;

  if v_challenge_status = 'claimed' then
    raise exception 'Challenge already claimed';
  end if;

  if v_challenge_status <> 'completed' then
    raise exception 'Challenge is not completed';
  end if;

  update public.user_challenges
  set status = 'claimed',
      completed_at = coalesce(completed_at, now())
  where id = p_user_challenge_id
    and user_id = p_user_id
    and status = 'completed';

  if not found then
    raise exception 'Challenge claim failed';
  end if;

  update public.profiles
  set total_exp = coalesce(total_exp, 0) + coalesce(v_reward_exp, 0),
      coins = coalesce(coins, 0) + coalesce(v_reward_coins, 0)
  where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'exp_gained', v_reward_exp,
    'coins_gained', v_reward_coins
  );
end;
$$;

revoke all on function public.claim_challenge_reward(uuid, uuid) from public, anon;
grant execute on function public.claim_challenge_reward(uuid, uuid) to authenticated, service_role;