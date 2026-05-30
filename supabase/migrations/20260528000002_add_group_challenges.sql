-- Sprint 21: Social Features v2 - Group Challenges
-- ==============================================

-- Create group_challenges table
CREATE TABLE IF NOT EXISTS public.group_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stake_coins INT DEFAULT 0,
    max_participants INT DEFAULT 10,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group_challenge_participants table
CREATE TABLE IF NOT EXISTS public.group_challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.group_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_ml BIGINT DEFAULT 0,
    rank_position INT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(challenge_id, user_id)
);

-- RLS for group_challenges
ALTER TABLE public.group_challenges ENABLE ROW LEVEL SECURITY;

-- Anyone can view active challenges
CREATE POLICY "Anyone can view group challenges"
ON public.group_challenges FOR SELECT
TO authenticated
USING (status IN ('active', 'completed'));

-- Creator can insert group challenges
CREATE POLICY "Creator can insert group challenges"
ON public.group_challenges FOR INSERT
TO authenticated
WITH CHECK (creator_id = (SELECT auth.uid()));

-- Creator can update their challenges
CREATE POLICY "Creator can update their challenges"
ON public.group_challenges FOR UPDATE
TO authenticated
USING (creator_id = (SELECT auth.uid()));

-- RLS for participants
ALTER TABLE public.group_challenge_participants ENABLE ROW LEVEL SECURITY;

-- Participants can view challenge participants
CREATE POLICY "Participants can view challenge participants"
ON public.group_challenge_participants FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.group_challenges
        WHERE id = challenge_id
    )
);

-- Users can join challenges
CREATE POLICY "Users can join challenges"
ON public.group_challenge_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own participation
CREATE POLICY "Users can update their participation"
ON public.group_challenge_participants FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_challenges_status ON public.group_challenges(status);
CREATE INDEX IF NOT EXISTS idx_group_challenges_dates ON public.group_challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_group_participants_challenge ON public.group_challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user ON public.group_challenge_participants(user_id);

-- Function to join a group challenge
CREATE OR REPLACE FUNCTION public.join_group_challenge(p_challenge_id UUID)
RETURNS void AS $$
DECLARE
    v_current_user_id UUID;
    v_count INT;
BEGIN
    v_current_user_id := (SELECT auth.uid());

    -- Check if challenge exists and is joinable
    IF NOT EXISTS (
        SELECT 1 FROM public.group_challenges
        WHERE id = p_challenge_id AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Challenge not available' USING ERRCODE = '22023';
    END IF;

    -- Check participant count
    SELECT COUNT(*) INTO v_count
    FROM public.group_challenge_participants
    WHERE challenge_id = p_challenge_id;

    IF v_count >= (SELECT max_participants FROM public.group_challenges WHERE id = p_challenge_id) THEN
        RAISE EXCEPTION 'Challenge is full' USING ERRCODE = '22023';
    END IF;

    -- Insert participant
    INSERT INTO public.group_challenge_participants (challenge_id, user_id)
    VALUES (p_challenge_id, v_current_user_id)
    ON CONFLICT (challenge_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.join_group_challenge(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.join_group_challenge(uuid) TO authenticated;

-- Function to get group challenge leaderboard
CREATE OR REPLACE FUNCTION public.get_group_challenge_leaderboard(p_challenge_id UUID)
RETURNS TABLE(
    rank_position INT,
    user_id UUID,
    nickname TEXT,
    avatar_url TEXT,
    total_ml BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY gcp.total_ml DESC)::int AS rank_position,
        gcp.user_id,
        p.nickname,
        p.avatar_url,
        gcp.total_ml
    FROM public.group_challenge_participants gcp
    JOIN public.profiles p ON gcp.user_id = p.id
    WHERE gcp.challenge_id = p_challenge_id
    ORDER BY gcp.total_ml DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_group_challenge_leaderboard(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_group_challenge_leaderboard(uuid) TO authenticated;

-- Trigger to enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_challenge_participants;
