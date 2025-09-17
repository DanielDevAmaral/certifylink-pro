-- Create storage bucket for certification screenshots
INSERT INTO storage.buckets (
  id, 
  name, 
  public
) VALUES (
  'certification-screenshots', 
  'certification-screenshots', 
  true
);

-- Create RLS policies for certification screenshots
CREATE POLICY "Users can upload their own certification screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'certification-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own certification screenshots"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'certification-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all certification screenshots"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'certification-screenshots' 
  AND get_user_role(auth.uid()) = 'admin'::user_role
);

CREATE POLICY "Leaders can view team certification screenshots"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'certification-screenshots' 
  AND is_team_leader(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Users can update their own certification screenshots"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'certification-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own certification screenshots"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'certification-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);