-- Fix hydration_battles winner_id FK to reference public_profiles
-- Bots (00000000-0000-0000-0000-000000000002 etc.) only exist in public_profiles,
-- so setting winner_id to a bot when battle completes violates the old FK.

ALTER TABLE public.hydration_battles
  DROP CONSTRAINT IF EXISTS hydration_battles_winner_id_fkey,
  DROP CONSTRAINT IF EXISTS hydration_battles_winner_public_profile_fkey,
  ADD CONSTRAINT hydration_battles_winner_public_profile_fkey
    FOREIGN KEY (winner_id) REFERENCES public.public_profiles(id) ON DELETE SET NULL;
