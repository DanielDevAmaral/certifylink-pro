-- Create a secure function to get full names without RLS restrictions
CREATE OR REPLACE FUNCTION public.get_full_names(user_ids uuid[])
RETURNS TABLE(user_id uuid, full_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.full_name
  FROM public.profiles p
  WHERE p.user_id = ANY(user_ids);
END;
$$;