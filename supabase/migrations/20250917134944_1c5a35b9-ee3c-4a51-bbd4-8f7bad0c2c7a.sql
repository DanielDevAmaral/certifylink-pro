-- Add RLS policy to allow leaders to view roles of their team members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND policyname = 'Leaders can view team roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Leaders can view team roles" 
      ON public.user_roles 
      FOR SELECT 
      USING (is_team_leader(auth.uid(), user_id))';
  END IF;
END $$;