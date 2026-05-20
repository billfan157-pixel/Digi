-- Allow grace period users to access premium AI limits
CREATE OR REPLACE FUNCTION public.consume_ai_usage(p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
      and (
        (subscription_end is null or subscription_end > now())
        or
        (grace_period_end is not null and grace_period_end > now())
      )
  )
  into v_is_premium;

  v_limit := case
    when v_is_premium then 1000000
    when v_column = 'message_count' then 20
    when v_column = 'advice_count' then 15
    when v_column = 'scan_count' then 5
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
$function$;
