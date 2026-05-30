-- Fix club_battles.updated_at: add DEFAULT and auto-update trigger
-- Prevents NULL updated_at on newly created rows and ensures auto-refresh on UPDATE

-- 1. Add DEFAULT now() for new rows
ALTER TABLE public.club_battles
  ALTER COLUMN updated_at SET DEFAULT now();

-- 2. Backfill existing NULL rows
UPDATE public.club_battles
  SET updated_at = created_at
  WHERE updated_at IS NULL;

-- 3. Add auto-update trigger (reuses existing helper if available, else create)
CREATE OR REPLACE FUNCTION public.update_club_battles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_club_battles_updated_at ON public.club_battles;

CREATE TRIGGER trg_club_battles_updated_at
  BEFORE UPDATE ON public.club_battles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_club_battles_updated_at();
