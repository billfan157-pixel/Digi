-- Add wellness tracking fields to profiles table
-- This migration supports Problem 1 solution: Wellness Journey Feature

-- Sleep tracking
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sleep_hours NUMERIC DEFAULT 8,
  ADD COLUMN IF NOT EXISTS sleep_quality INTEGER DEFAULT 7;

-- Mood and energy tracking preferences
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mood_tracking BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS energy_tracking BOOLEAN DEFAULT TRUE;

-- Health data sync flag
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sync_wellness_data BOOLEAN DEFAULT FALSE;

-- Comments for documentation
COMMENT ON COLUMN profiles.sleep_hours IS 'Target sleep duration in hours (user preference)';
COMMENT ON COLUMN profiles.sleep_quality IS 'Self-reported sleep quality rating (1-10 scale)';
COMMENT ON COLUMN profiles.mood_tracking IS 'Whether user has enabled daily mood check-ins';
COMMENT ON COLUMN profiles.energy_tracking IS 'Whether user tracks daily energy levels';
COMMENT ON COLUMN profiles.sync_wellness_data IS 'Whether to sync with Apple Health / Google Fit for wellness data';

-- Index for potential queries (if needed later)
-- CREATE INDEX idx_profiles_sync_wellness ON profiles(sync_wellness_data) WHERE sync_wellness_data = TRUE;
