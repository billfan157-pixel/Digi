-- Sprint 13-14: AI Personalization Engine
-- Migration 2: smart_reminders table

CREATE TABLE IF NOT EXISTS public.smart_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  message TEXT NOT NULL,
  suggested_amount INTEGER,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response_amount INTEGER
);

-- Index for querying upcoming reminders
CREATE INDEX IF NOT EXISTS idx_smart_reminders_user_status 
  ON public.smart_reminders (user_id, scheduled_at, status);

-- RLS
ALTER TABLE public.smart_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reminders" 
  ON public.smart_reminders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" 
  ON public.smart_reminders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" 
  ON public.smart_reminders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RPC to mark reminder as sent
CREATE OR REPLACE FUNCTION public.mark_reminder_sent(reminder_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.smart_reminders
  SET status = 'sent', sent_at = now()
  WHERE id = reminder_id AND user_id = auth.uid();
END;
$$;

-- RPC to mark reminder as responded
CREATE OR REPLACE FUNCTION public.mark_reminder_responded(
  reminder_id UUID,
  p_amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.smart_reminders
  SET status = 'completed', responded_at = now(), response_amount = p_amount
  WHERE id = reminder_id AND user_id = auth.uid();
END;
$$;