-- Create RLS policy to allow leaders to update their team members' profiles
CREATE POLICY "Leaders can update team profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_team_leader(auth.uid(), user_id));