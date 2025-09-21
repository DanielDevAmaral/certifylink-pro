-- Clean up invalid certification references in technical_attestations
-- First, convert the column to text[] to handle mixed data
ALTER TABLE technical_attestations 
ALTER COLUMN related_certifications TYPE text[] USING related_certifications::text[];

-- Then clean up invalid UUID values
UPDATE technical_attestations 
SET related_certifications = (
  SELECT COALESCE(
    array_agg(cert_id) FILTER (WHERE cert_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    ARRAY[]::text[]
  )
  FROM unnest(related_certifications) AS cert_id
)
WHERE related_certifications IS NOT NULL 
  AND array_length(related_certifications, 1) > 0;