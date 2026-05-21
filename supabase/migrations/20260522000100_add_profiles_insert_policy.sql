-- Create INSERT policy for public.profiles to allow users to insert/upsert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK ((SELECT auth.uid()) = id);
