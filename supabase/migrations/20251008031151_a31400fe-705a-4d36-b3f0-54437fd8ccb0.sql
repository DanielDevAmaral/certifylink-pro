-- Drop old restrictive policy that only allowed leaders to view team member roles
DROP POLICY IF EXISTS "Leaders can view team roles" ON public.user_roles;

-- Create new permissive policy for viewing roles
-- Leaders and admins can view all user roles (but only admins can modify)
CREATE POLICY "Leaders and admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) IN ('admin', 'leader')
  OR auth.uid() = user_id
);