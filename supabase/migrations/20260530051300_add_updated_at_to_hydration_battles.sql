-- Fix missing updated_at column on hydration_battles
-- This column is referenced by resolve_stale_battle, accept_battle, and many other RPCs
-- but was never added to the original table schema.

ALTER TABLE public.hydration_battles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill existing rows so they have a sensible updated_at value
UPDATE public.hydration_battles
  SET updated_at = created_at
  WHERE updated_at IS NULL;

-- Add automatic updated_at refresh trigger (optional but recommended)
CREATE OR REPLACE FUNCTION public.set_hydration_battles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hydration_battles_updated_at ON public.hydration_battles;

CREATE TRIGGER trg_hydration_battles_updated_at
  BEFORE UPDATE ON public.hydration_battles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_hydration_battles_updated_at();
