-- ============================================
-- Fix: Add Explicit Authentication Checks to Profiles Table RLS Policies
-- ============================================
-- This migration adds explicit auth.uid() IS NOT NULL checks to all RLS policies
-- on the profiles table to prevent any potential unauthorized access.

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leaders can view direct team members profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leaders can update direct team members profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

-- Recreate policies with explicit authentication checks

-- SELECT policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role(auth.uid()) = 'admin'::user_role
  );

CREATE POLICY "Leaders can view direct team members profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND is_direct_team_leader(auth.uid(), user_id)
  );

-- INSERT policies
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

-- UPDATE policies
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role(auth.uid()) = 'admin'::user_role
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND get_user_role(auth.uid()) = 'admin'::user_role
  );

CREATE POLICY "Leaders can update direct team members profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND is_direct_team_leader(auth.uid(), user_id)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND is_direct_team_leader(auth.uid(), user_id)
  );

-- DELETE policies
CREATE POLICY "Only admins can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role(auth.uid()) = 'admin'::user_role
  );