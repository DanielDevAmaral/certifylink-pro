-- Make documents bucket public to allow logo access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';