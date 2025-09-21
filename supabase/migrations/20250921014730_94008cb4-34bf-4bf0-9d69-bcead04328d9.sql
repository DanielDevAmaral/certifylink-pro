-- Allow admins to update all certifications
CREATE POLICY "Admins can update all certifications" 
ON public.certifications 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);