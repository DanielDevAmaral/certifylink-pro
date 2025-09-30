-- Migration: Add user_id to related_certifications structure
-- Change related_certifications from text[] to jsonb[] to store {certification_id, user_id} objects

-- First, create a function to migrate existing data
CREATE OR REPLACE FUNCTION migrate_related_certifications()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  att_record RECORD;
  new_related_certs jsonb[];
  cert_id text;
BEGIN
  FOR att_record IN SELECT id, user_id, related_certifications FROM technical_attestations WHERE related_certifications IS NOT NULL LOOP
    new_related_certs := ARRAY[]::jsonb[];
    
    FOREACH cert_id IN ARRAY att_record.related_certifications LOOP
      new_related_certs := array_append(
        new_related_certs, 
        jsonb_build_object('certification_id', cert_id, 'user_id', att_record.user_id)
      );
    END LOOP;
    
    UPDATE technical_attestations 
    SET related_certifications_new = new_related_certs
    WHERE id = att_record.id;
  END LOOP;
END;
$$;

-- Add temporary column for new structure
ALTER TABLE technical_attestations 
ADD COLUMN IF NOT EXISTS related_certifications_new jsonb[];

-- Migrate existing data (assumes existing certifications belong to attestation owner)
SELECT migrate_related_certifications();

-- Drop old column and rename new one
ALTER TABLE technical_attestations 
DROP COLUMN related_certifications;

ALTER TABLE technical_attestations 
RENAME COLUMN related_certifications_new TO related_certifications;

-- Clean up migration function
DROP FUNCTION migrate_related_certifications();