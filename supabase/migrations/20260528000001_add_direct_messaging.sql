-- Sprint 21: Social Features v2 - Direct Messaging
-- ================================================

-- Safe drop of legacy conversations and direct_messages tables/views to ensure correct schema
-- allow-destructive-change: Recreating DM schema after legacy table redesign
DROP TABLE IF EXISTS public.direct_messages CASCADE;
-- allow-destructive-change: Recreating DM schema after legacy table redesign
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP VIEW IF EXISTS public.conversations CASCADE;

-- Create conversations table (1:1 chat threads)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_preview TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_1, participant_2)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they're part of
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (participant_1 = (SELECT auth.uid()) OR participant_2 = (SELECT auth.uid()));

-- Users can create conversations
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (participant_1 = (SELECT auth.uid()) OR participant_2 = (SELECT auth.uid()));

-- RLS for messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in conversations they're part of
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = conversation_id
        AND (participant_1 = (SELECT auth.uid()) OR participant_2 = (SELECT auth.uid()))
    )
);

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages"
ON public.direct_messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = conversation_id
        AND (participant_1 = (SELECT auth.uid()) OR participant_2 = (SELECT auth.uid()))
    )
);

-- Users can update their own messages
CREATE POLICY "Users can update their own messages"
ON public.direct_messages FOR UPDATE
TO authenticated
USING (sender_id = (SELECT auth.uid()));

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.direct_messages FOR DELETE
TO authenticated
USING (sender_id = (SELECT auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.direct_messages(sender_id);

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_current_user_id UUID;
    v_conversation_id UUID;
BEGIN
    v_current_user_id := (SELECT auth.uid());

    -- Prevent self-messaging
    IF v_current_user_id = p_other_user_id THEN
        RAISE EXCEPTION 'Cannot create conversation with yourself' USING ERRCODE = '22023';
    END IF;

    -- Check if conversation exists
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE (participant_1 = v_current_user_id AND participant_2 = p_other_user_id)
       OR (participant_1 = p_other_user_id AND participant_2 = v_current_user_id);

    -- Create if doesn't exist
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_1, participant_2)
        VALUES (v_current_user_id, p_other_user_id)
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;

-- Function to get messages in a conversation
CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_conversation_id UUID, p_limit INT DEFAULT 50)
RETURNS TABLE(
    id UUID,
    sender_id UUID,
    content TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    sender_nickname TEXT,
    sender_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dm.id,
        dm.sender_id,
        dm.content,
        dm.is_read,
        dm.created_at,
        p.nickname,
        p.avatar_url
    FROM public.direct_messages dm
    JOIN public.profiles p ON dm.sender_id = p.id
    WHERE dm.conversation_id = p_conversation_id
    ORDER BY dm.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_conversation_messages(uuid, int) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_conversation_messages(uuid, int) TO authenticated;

-- Function to get user's conversations with last message
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE(
    conversation_id UUID,
    participant_id UUID,
    participant_nickname TEXT,
    participant_avatar TEXT,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    unread_count INT
) AS $$
DECLARE
    v_current_user_id UUID;
BEGIN
    v_current_user_id := (SELECT auth.uid());

    RETURN QUERY
    SELECT
        c.id AS conversation_id,
        CASE WHEN c.participant_1 = v_current_user_id THEN c.participant_2 ELSE c.participant_1 END AS participant_id,
        p.nickname,
        p.avatar_url,
        c.last_message_at,
        c.last_message_preview,
        (
            SELECT COUNT(*)::int
            FROM public.direct_messages dm
            WHERE dm.conversation_id = c.id
            AND dm.sender_id != v_current_user_id
            AND dm.is_read = FALSE
        ) AS unread_count
    FROM public.conversations c
    JOIN public.profiles p ON (
        CASE WHEN c.participant_1 = v_current_user_id THEN c.participant_2 ELSE c.participant_1 END = p.id
    )
    WHERE c.participant_1 = v_current_user_id OR c.participant_2 = v_current_user_id
    ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_user_conversations() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO authenticated;

-- Function to send message and update conversation
CREATE OR REPLACE FUNCTION public.send_direct_message(p_conversation_id UUID, p_content TEXT)
RETURNS UUID AS $$
DECLARE
    v_current_user_id UUID;
    v_message_id UUID;
BEGIN
    v_current_user_id := (SELECT auth.uid());

    -- Insert message
    INSERT INTO public.direct_messages (conversation_id, sender_id, content)
    VALUES (p_conversation_id, v_current_user_id, p_content)
    RETURNING id INTO v_message_id;

    -- Update conversation
    UPDATE public.conversations
    SET last_message_at = NOW(), last_message_preview = LEFT(p_content, 100)
    WHERE id = p_conversation_id;

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.send_direct_message(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.send_direct_message(uuid, text) TO authenticated;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_conversation_id UUID)
RETURNS void AS $$
DECLARE
    v_current_user_id UUID;
BEGIN
    v_current_user_id := (SELECT auth.uid());

    UPDATE public.direct_messages
    SET is_read = TRUE
    WHERE conversation_id = p_conversation_id
    AND sender_id != v_current_user_id
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.mark_messages_read(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid) TO authenticated;

-- Trigger to enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
