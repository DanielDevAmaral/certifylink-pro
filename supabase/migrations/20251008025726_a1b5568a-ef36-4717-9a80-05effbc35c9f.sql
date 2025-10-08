-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Admins can manage skills" ON public.technical_skills;

-- Create new policy allowing both admins and leaders to manage skills
CREATE POLICY "Admins and leaders can manage skills"
ON public.technical_skills
FOR ALL
TO authenticated
USING (
  get_user_role(auth.uid()) IN ('admin'::user_role, 'leader'::user_role)
)
WITH CHECK (
  get_user_role(auth.uid()) IN ('admin'::user_role, 'leader'::user_role)
);