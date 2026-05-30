-- Add structured duel fields to hydration_battles
-- Enables target_ml, deadline, mode columns for Phase 1 Duel Upgrade

ALTER TABLE public.hydration_battles
  ADD COLUMN IF NOT EXISTS target_ml integer NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS deadline timestamptz,
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'Đua mục tiêu';
