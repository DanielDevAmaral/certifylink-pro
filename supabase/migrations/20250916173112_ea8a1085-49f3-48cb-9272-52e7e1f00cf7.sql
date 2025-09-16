-- Create storage buckets for documents and certifications
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('documents', 'documents', false),
  ('certifications', 'certifications', false);

-- Create storage policies for documents bucket
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for certifications bucket
CREATE POLICY "Users can view their own certification files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own certification files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own certification files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own certification files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add missing RLS policies for teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all teams" ON public.teams
FOR ALL USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Leaders can view their own teams" ON public.teams
FOR SELECT USING (leader_id = auth.uid());

CREATE POLICY "Team members can view their teams" ON public.teams
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = teams.id AND user_id = auth.uid()
  )
);

-- Add missing RLS policies for team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all team members" ON public.team_members
FOR ALL USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Leaders can manage their team members" ON public.team_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_members.team_id AND leader_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own team memberships" ON public.team_members
FOR SELECT USING (user_id = auth.uid());