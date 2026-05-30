-- Sprint 21: Social Features v2 - Story Emoji Reactions
-- ======================================================

-- Create story reactions table
CREATE TABLE IF NOT EXISTS public.story_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji VARCHAR(32) NOT NULL DEFAULT '❤️',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, user_id, emoji)
);

-- RLS policies
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

-- Users can see all reactions on stories they can view
CREATE POLICY "Anyone can view story reactions"
ON public.story_reactions FOR SELECT
TO authenticated
USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add their own reactions"
ON public.story_reactions FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own reactions
CREATE POLICY "Users can update their own reactions"
ON public.story_reactions FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
ON public.story_reactions FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON public.story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON public.story_reactions(user_id);

-- Add reaction counts to social_posts (denormalized for performance)
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS reaction_counts JSONB DEFAULT '{"❤️":0,"😂":0,"😮":0,"😢":0,"🔥":0}'::jsonb;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS total_reactions INT DEFAULT 0;

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION public.update_story_reaction_counts(p_story_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.social_posts
    SET
        reaction_counts = COALESCE(
            (SELECT jsonb_object_agg(emoji, count)::jsonb
             FROM public.story_reactions
             WHERE story_id = p_story_id
             GROUP BY emoji),
            '{"❤️":0,"😂":0,"😮":0,"😢":0,"🔥":0}'::jsonb
        ),
        total_reactions = (
            SELECT COUNT(*)::int
            FROM public.story_reactions
            WHERE story_id = p_story_id
        )
    WHERE id = p_story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update counts on reaction change
CREATE OR REPLACE FUNCTION public.trigger_update_story_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.update_story_reaction_counts(
        CASE WHEN TG_OP = 'DELETE' THEN OLD.story_id ELSE NEW.story_id END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS story_reactions_count_trigger ON public.story_reactions;
CREATE TRIGGER story_reactions_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.story_reactions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_story_reaction_counts();

-- RPC function to toggle reaction
CREATE OR REPLACE FUNCTION public.toggle_story_reaction(
    p_story_id UUID,
    p_emoji VARCHAR(32) DEFAULT '❤️'
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_existing_id UUID;
    v_result JSONB;
BEGIN
    v_user_id := (SELECT auth.uid());

    -- Check if user already reacted with this emoji
    SELECT id INTO v_existing_id
    FROM public.story_reactions
    WHERE story_id = p_story_id AND user_id = v_user_id AND emoji = p_emoji;

    IF v_existing_id IS NOT NULL THEN
        -- Remove reaction
        DELETE FROM public.story_reactions WHERE id = v_existing_id;
        v_result := jsonb_build_object('action', 'removed', 'emoji', p_emoji);
    ELSE
        -- Add reaction
        INSERT INTO public.story_reactions (story_id, user_id, emoji)
        VALUES (p_story_id, v_user_id, p_emoji);
        v_result := jsonb_build_object('action', 'added', 'emoji', p_emoji);
    END IF;

    -- Return updated counts
    SELECT reaction_counts, total_reactions INTO v_result
    FROM public.social_posts
    WHERE id = p_story_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict execute to authenticated users only
REVOKE EXECUTE ON FUNCTION public.toggle_story_reaction(uuid, varchar) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.toggle_story_reaction(uuid, varchar) TO authenticated;

-- Get reaction summary for a story
CREATE OR REPLACE FUNCTION public.get_story_reactions(p_story_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_counts JSONB;
    v_user_reactions JSONB;
    v_user_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());

    -- Get total counts
    SELECT reaction_counts INTO v_counts
    FROM public.social_posts
    WHERE id = p_story_id;

    -- Get user's own reactions
    SELECT COALESCE(jsonb_agg(emoji), '[]'::jsonb) INTO v_user_reactions
    FROM public.story_reactions
    WHERE story_id = p_story_id AND user_id = v_user_id;

    RETURN jsonb_build_object(
        'counts', v_counts,
        'user_reactions', v_user_reactions
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_story_reactions(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_story_reactions(uuid) TO authenticated;
