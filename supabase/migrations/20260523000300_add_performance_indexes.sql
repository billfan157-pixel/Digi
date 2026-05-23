-- Add missing performance indexes for slow queries

-- Index for daily quests assignment/lookup optimization
CREATE INDEX IF NOT EXISTS idx_user_quests_user_assigned_date ON public.user_quests (user_id, assigned_date);

-- Index for equipped bottle profile lookup
CREATE INDEX IF NOT EXISTS idx_profiles_equipped_bottle_id ON public.profiles (equipped_bottle_id) WHERE equipped_bottle_id IS NOT NULL;
