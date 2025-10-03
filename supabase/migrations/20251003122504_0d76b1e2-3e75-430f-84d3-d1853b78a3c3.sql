-- Create function to get users last sign in from auth.users
CREATE OR REPLACE FUNCTION public.get_users_last_sign_in(user_ids uuid[])
RETURNS TABLE(user_id uuid, last_sign_in_at timestamp with time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id as user_id, au.last_sign_in_at
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;