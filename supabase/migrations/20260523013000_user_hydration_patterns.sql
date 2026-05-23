-- Sprint 13-14: AI Personalization Engine
-- Migration 1: user_hydration_patterns table

CREATE TABLE IF NOT EXISTS public.user_hydration_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  blind_spots JSONB,
  peak_hours INTEGER[],
  weather_factor NUMERIC(4,2),
  consistency_score INTEGER,
  trend TEXT,
  weekly_avg_completion NUMERIC(5,2),
  best_day_of_week INTEGER,
  worst_day_of_week INTEGER,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_user_hydration_patterns_user_date 
  ON public.user_hydration_patterns (user_id, snapshot_date DESC);

-- RLS
ALTER TABLE public.user_hydration_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own patterns" 
  ON public.user_hydration_patterns 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns" 
  ON public.user_hydration_patterns 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns" 
  ON public.user_hydration_patterns 
  FOR UPDATE 
  USING (auth.uid() = user_id);