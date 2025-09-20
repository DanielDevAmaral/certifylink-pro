-- Update the trigger function to use dynamic alert days
CREATE OR REPLACE FUNCTION public.update_status_on_validity_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  alert_days integer;
  new_status document_status;
  doc_type text;
BEGIN
  -- Determine document type based on table name
  CASE TG_TABLE_NAME
    WHEN 'certifications' THEN doc_type := 'certification';
    WHEN 'technical_attestations' THEN doc_type := 'technical_attestation';
    WHEN 'legal_documents' THEN doc_type := 'legal_document';
    ELSE doc_type := 'certification'; -- fallback
  END CASE;

  -- Get alert days for this document type
  alert_days := get_alert_days(doc_type);

  -- Calculate the new status based on validity_date and dynamic alert days
  IF NEW.validity_date IS NULL THEN
    new_status := 'valid'::document_status;
  ELSIF NEW.validity_date <= current_date THEN
    new_status := 'expired'::document_status;
  ELSIF NEW.validity_date <= (current_date + (alert_days || ' days')::interval) THEN
    new_status := 'expiring'::document_status;
  ELSE
    new_status := 'valid'::document_status;
  END IF;

  -- Update the status if it changed
  NEW.status := new_status;
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$function$