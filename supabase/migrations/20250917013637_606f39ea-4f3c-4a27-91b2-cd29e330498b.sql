-- Fix infinite recursion in RLS policies between teams and team_members tables

-- First, drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Leaders can manage their team members" ON public.team_members;

-- Create helper functions with SECURITY DEFINER to break RLS recursion
CREATE OR REPLACE FUNCTION public.is_user_team_member(user_uuid uuid, target_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = user_uuid AND team_id = target_team_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_user_team_leader(user_uuid uuid, target_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = target_team_id AND leader_id = user_uuid
  );
$$;

-- Recreate the policies using the helper functions to avoid recursion
CREATE POLICY "Team members can view their teams" 
ON public.teams 
FOR SELECT 
USING (is_user_team_member(auth.uid(), id));

CREATE POLICY "Leaders can manage their team members" 
ON public.team_members 
FOR ALL 
USING (is_user_team_leader(auth.uid(), team_id));

-- Grant necessary permissions for the helper functions
GRANT EXECUTE ON FUNCTION public.is_user_team_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_team_leader(uuid, uuid) TO authenticated;