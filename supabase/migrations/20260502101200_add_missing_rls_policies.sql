do $$
begin
  if to_regclass('public.bottles') is not null then
    drop policy if exists bottles_read_authenticated on public.bottles;
    create policy bottles_read_authenticated
    on public.bottles
    for select
    to authenticated
    using (true);
  end if;

  if to_regclass('public.game_balance_config') is not null then
    drop policy if exists game_balance_config_read_authenticated on public.game_balance_config;
    create policy game_balance_config_read_authenticated
    on public.game_balance_config
    for select
    to authenticated
    using (true);
  end if;

  if to_regclass('public.world_bosses') is not null then
    drop policy if exists world_bosses_read_authenticated on public.world_bosses;
    create policy world_bosses_read_authenticated
    on public.world_bosses
    for select
    to authenticated
    using (true);
  end if;

  if to_regclass('public.active_buffs') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'active_buffs'
         and column_name = 'user_id'
     ) then
    drop policy if exists active_buffs_select_own on public.active_buffs;
    create policy active_buffs_select_own
    on public.active_buffs
    for select
    to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if to_regclass('public.user_bottles') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'user_bottles'
         and column_name = 'user_id'
     ) then
    drop policy if exists user_bottles_select_own on public.user_bottles;
    create policy user_bottles_select_own
    on public.user_bottles
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

    drop policy if exists user_bottles_insert_own on public.user_bottles;
    create policy user_bottles_insert_own
    on public.user_bottles
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if to_regclass('public.post_cheers') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'post_cheers'
         and column_name = 'user_id'
     ) then
    drop policy if exists post_cheers_select_own on public.post_cheers;
    create policy post_cheers_select_own
    on public.post_cheers
    for select
    to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if to_regclass('public.quest_reward_logs') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'quest_reward_logs'
         and column_name = 'user_id'
     ) then
    drop policy if exists quest_reward_logs_select_own on public.quest_reward_logs;
    create policy quest_reward_logs_select_own
    on public.quest_reward_logs
    for select
    to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if to_regclass('public.club_challenges') is not null
     and to_regclass('public.club_members') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'club_challenges'
         and column_name = 'club_id'
     ) then
    drop policy if exists club_challenges_read_members on public.club_challenges;
    create policy club_challenges_read_members
    on public.club_challenges
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.club_members cm
        where cm.club_id = club_challenges.club_id
          and cm.user_id = (select auth.uid())
      )
    );
  end if;

  if to_regclass('public.club_daily_stats') is not null
     and to_regclass('public.club_members') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'club_daily_stats'
         and column_name = 'club_id'
     ) then
    drop policy if exists club_daily_stats_read_members on public.club_daily_stats;
    create policy club_daily_stats_read_members
    on public.club_daily_stats
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.club_members cm
        where cm.club_id = club_daily_stats.club_id
          and cm.user_id = (select auth.uid())
      )
    );

    drop policy if exists club_daily_stats_delete_owner on public.club_daily_stats;
    create policy club_daily_stats_delete_owner
    on public.club_daily_stats
    for delete
    to authenticated
    using (
      exists (
        select 1
        from public.clubs c
        where c.id = club_daily_stats.club_id
          and c.owner_id = (select auth.uid())
      )
    );
  end if;
end;
$$;
