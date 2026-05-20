-- Ensure trigger on auth.users to auto-create profile on signup
-- The handle_new_user() function was created in 20260504032420
-- but the trigger binding was previously configured via Dashboard, not tracked in migrations.
-- This makes it repeatable for fresh DB deployments.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
