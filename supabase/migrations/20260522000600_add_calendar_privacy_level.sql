-- Add calendar_privacy_level column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'calendar_privacy_level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN calendar_privacy_level TEXT DEFAULT 'standard';
    -- Add CHECK constraint
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_calendar_privacy_level_check CHECK (calendar_privacy_level IN ('off', 'standard', 'strict'));
  END IF;
END;
$$;
