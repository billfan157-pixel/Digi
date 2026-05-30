-- Add structured fields to social_posts for purchase sharing + duel stake tracking

alter table if exists public.social_posts
  add column if not exists event_type text,
  add column if not exists reference_id text,
  add column if not exists stake_coins integer default 0;

create index if not exists idx_social_posts_event_type
  on public.social_posts (event_type)
  where event_type is not null;
