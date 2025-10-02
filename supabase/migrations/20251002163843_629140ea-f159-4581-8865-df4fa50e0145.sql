-- Fix profiles table RLS policies to explicitly block unauthenticated access
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leaders can update direct team members profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leaders can view direct team members profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Recreate policies with explicit authentication requirement (TO authenticated)
-- This ensures unauthenticated users are completely blocked

-- SELECT policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Leaders can view direct team members profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (is_direct_team_leader(auth.uid(), user_id));

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- INSERT policies
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policies
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leaders can update direct team members profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (is_direct_team_leader(auth.uid(), user_id))
  WITH CHECK (is_direct_team_leader(auth.uid(), user_id));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

-- Add explicit DELETE policy (currently missing)
CREATE POLICY "Only admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin'::user_role);