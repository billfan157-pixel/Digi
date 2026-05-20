-- Sprint 1: Security & RLS cleanup
-- 1. Fix ai_usage_self: change grant from public → authenticated
-- 2. Drop duplicate policies that may exist from multiple CREATE cycles

-- Fix ai_usage_self: public → authenticated
DROP POLICY IF EXISTS "ai_usage_self" ON public.ai_usage;
CREATE POLICY "ai_usage_self"
  ON public.ai_usage
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
