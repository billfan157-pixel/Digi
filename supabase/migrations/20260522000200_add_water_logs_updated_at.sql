-- Add updated_at column to water_logs table
ALTER TABLE public.water_logs ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create it
DROP TRIGGER IF EXISTS trg_update_water_logs_updated_at ON public.water_logs;
CREATE TRIGGER trg_update_water_logs_updated_at
    BEFORE UPDATE ON public.water_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
