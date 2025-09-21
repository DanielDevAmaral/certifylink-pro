-- Clean up invalid certification references in technical_attestations
-- Remove non-UUID values from related_certifications arrays

UPDATE technical_attestations 
SET related_certifications = (
  SELECT COALESCE(
    array_agg(cert_id::text) FILTER (WHERE cert_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    ARRAY[]::text[]
  )
  FROM unnest(related_certifications) AS cert_id
)
WHERE related_certifications IS NOT NULL 
  AND array_length(related_certifications, 1) > 0;