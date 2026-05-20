-- =============================================================================
-- Deduplicate RLS policies: remove redundant policies with identical
-- table + operation + condition + role as an existing policy.
-- =============================================================================

-- saved_posts: "Users can delete own saved posts" == delete_own_saved_v1
-- Keep: delete_own_saved_v1  |  Drop: "Users can delete own saved posts"
drop policy if exists "Users can delete own saved posts" on public.saved_posts;

-- social_comments: "Authors can delete comments" == delete_own_comments_v1
-- Keep: delete_own_comments_v1  |  Drop: "Authors can delete comments"
drop policy if exists "Authors can delete comments" on public.social_comments;

-- social_posts DELETE: delete_own_posts_v1 == social_posts_delete_own
-- Keep: social_posts_delete_own  |  Drop: delete_own_posts_v1
drop policy if exists "delete_own_posts_v1" on public.social_posts;

-- social_posts INSERT: "Allow authenticated users insert" == social_posts_insert_own
-- Keep: social_posts_insert_own  |  Drop: "Allow authenticated users insert"
drop policy if exists "Allow authenticated users insert" on public.social_posts;
