-- Allow admins to delete all certifications
CREATE POLICY "Admins can delete all certifications" 
ON public.certifications 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);