-- Add bottle_auth_key to profiles table to store custom shared secret for BLE authentication
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bottle_auth_key TEXT;

-- Verify RLS policy is maintained (the existing policies are full-table SELECT and UPDATE for matching auth.uid() = id, which automatically includes this column).
