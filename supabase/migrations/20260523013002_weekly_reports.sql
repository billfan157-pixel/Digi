-- Sprint 13-14: AI Personalization Engine
-- Migration 3: weekly_reports table

CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_intake INTEGER NOT NULL,
  avg_daily NUMERIC(6,1),
  goal_hit_days INTEGER,
  best_day DATE,
  best_day_ml INTEGER,
  worst_day DATE,
  worst_day_ml INTEGER,
  trend TEXT,
  insight TEXT,
  tip TEXT,
  comparison_to_previous_week NUMERIC(5,2),
  consistency_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_week 
  ON public.weekly_reports (user_id, week_start DESC);

-- RLS
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reports" 
  ON public.weekly_reports 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" 
  ON public.weekly_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" 
  ON public.weekly_reports 
  FOR UPDATE 
  USING (auth.uid() = user_id);