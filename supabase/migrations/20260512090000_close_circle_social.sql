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
  end if;
end $$;

drop policy if exists "social_posts_select_visible" on public.social_posts;
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
  or (
    visibility = 'circle'
    and exists (
      select 1
      from public.widget_partners
      where user_id = social_posts.author_id
        and partner_id = (select auth.uid())
    )
  )
);
