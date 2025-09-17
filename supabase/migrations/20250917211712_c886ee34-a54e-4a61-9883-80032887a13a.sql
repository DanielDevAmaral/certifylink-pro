-- Create RLS policy to allow admins to update any user profile
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);