-- Create storage policies for logos folder in documents bucket
CREATE POLICY "Allow logo uploads for admins"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Allow logo access for all authenticated users"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Allow logo updates for admins"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Allow logo deletion for admins"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.uid() IS NOT NULL
);