-- Update the existing update_document_status function to be more accurate
CREATE OR REPLACE FUNCTION public.update_document_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  thirty_days_future date := CURRENT_DATE + INTERVAL '30 days';
BEGIN
  -- Update certifications status with correct logic
  UPDATE certifications SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date <= current_date THEN 'expired'::document_status
    WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;

  -- Update technical attestations status
  UPDATE technical_attestations SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date <= current_date THEN 'expired'::document_status
    WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;

  -- Update legal documents status  
  UPDATE legal_documents SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date <= current_date THEN 'expired'::document_status
    WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;
END;
$function$;

-- Create triggers to automatically update status when validity_date changes
CREATE OR REPLACE FUNCTION public.update_status_on_validity_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  thirty_days_future date := CURRENT_DATE + INTERVAL '30 days';
  new_status document_status;
BEGIN
  -- Calculate the new status based on validity_date
  IF NEW.validity_date IS NULL THEN
    new_status := 'valid'::document_status;
  ELSIF NEW.validity_date <= current_date THEN
    new_status := 'expired'::document_status;
  ELSIF NEW.validity_date <= thirty_days_future THEN
    new_status := 'expiring'::document_status;
  ELSE
    new_status := 'valid'::document_status;
  END IF;

  -- Update the status if it changed
  NEW.status := new_status;
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$function$;

-- Create triggers for all document tables
DROP TRIGGER IF EXISTS update_certification_status_trigger ON certifications;
CREATE TRIGGER update_certification_status_trigger
  BEFORE INSERT OR UPDATE OF validity_date ON certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_status_on_validity_change();

DROP TRIGGER IF EXISTS update_attestation_status_trigger ON technical_attestations;
CREATE TRIGGER update_attestation_status_trigger
  BEFORE INSERT OR UPDATE OF validity_date ON technical_attestations
  FOR EACH ROW
  EXECUTE FUNCTION update_status_on_validity_change();

DROP TRIGGER IF EXISTS update_legal_document_status_trigger ON legal_documents;
CREATE TRIGGER update_legal_document_status_trigger
  BEFORE INSERT OR UPDATE OF validity_date ON legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_status_on_validity_change();

-- Run initial status update for all existing records
SELECT update_document_status();