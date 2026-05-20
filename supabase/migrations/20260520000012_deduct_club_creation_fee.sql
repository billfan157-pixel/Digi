-- Create RPC function to securely deduct club creation fee and prevent BOLA
CREATE OR REPLACE FUNCTION public.deduct_club_creation_fee(p_user_id uuid, p_fee int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user is authenticated and is the one whose points are being deducted
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check if user has enough points
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id AND total_wp >= p_fee
  ) THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  -- Deduct fee atomically
  UPDATE public.profiles
  SET total_wp = total_wp - p_fee
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_club_creation_fee(uuid, int) TO authenticated;
