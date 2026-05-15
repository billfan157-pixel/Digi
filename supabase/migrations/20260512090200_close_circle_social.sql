-- Close Circle social compatibility for Pulse / Drop / Peak / Duel.
-- Keeps existing social_posts storage while allowing circle visibility for v1.5.

do $$
begin
  if to_regclass('public.social_posts') is not null then
    alter table public.social_posts
      drop constraint if exists social_posts_post_kind_check;

    alter table public.social_posts
      add constraint social_posts_post_kind_check
      check (post_kind in ('status', 'progress', 'story', 'challenge', 'milestone'));

    alter table public.social_posts
      drop constraint if exists social_posts_visibility_check;

    alter table public.social_posts
      add constraint social_posts_visibility_check
      check (visibility in ('public', 'followers', 'circle'));

    drop policy if exists "social_posts_select_visible" on public.social_posts;
    -- Note: 'circle' visibility requires widget_partners table which may not exist yet
    create policy "social_posts_select_visible"
    on public.social_posts
    for select
    to authenticated
    using (
      visibility = 'public'
      or author_id = (select auth.uid())
      or (
        visibility = 'followers'
        and exists (
          select 1
          from public.social_follows
          where follower_id = (select auth.uid())
            and following_id = social_posts.author_id
        )
      )
    );
  end if;
end $$;

-- Create social_post_likes table if social_posts exists
do $$
begin
  if to_regclass('public.social_posts') is not null then
    create table if not exists public.social_post_likes (
      post_id uuid not null references public.social_posts (id) on delete cascade,
      user_id uuid not null references public.profiles (id) on delete cascade,
      created_at timestamptz not null default timezone('utc', now()),
      primary key (post_id, user_id)
    );

    create index if not exists social_post_likes_user_idx
      on public.social_post_likes (user_id);

    create index if not exists social_post_likes_post_idx
      on public.social_post_likes (post_id);

    alter table public.social_post_likes enable row level security;

    drop policy if exists "social_post_likes_select_authenticated" on public.social_post_likes;
    create policy "social_post_likes_select_authenticated"
    on public.social_post_likes
    for select
    to authenticated
    using (true);

    drop policy if exists "social_post_likes_insert_own" on public.social_post_likes;
    create policy "social_post_likes_insert_own"
    on public.social_post_likes
    for insert
    to authenticated
    with check (auth.uid() = user_id);

    drop policy if exists "social_post_likes_delete_own" on public.social_post_likes;
    create policy "social_post_likes_delete_own"
    on public.social_post_likes
    for delete
    to authenticated
    using (auth.uid() = user_id);
  end if;
end $$;
