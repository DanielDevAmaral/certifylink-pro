-- Update the status calculation function to use dynamic alert days
CREATE OR REPLACE FUNCTION public.update_document_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  cert_alert_days integer;
  tech_alert_days integer;
  legal_alert_days integer;
BEGIN
  -- Get alert days for each document type
  cert_alert_days := get_alert_days('certification');
  tech_alert_days := get_alert_days('technical_attestation');
  legal_alert_days := get_alert_days('legal_document');

  -- Update certifications status with dynamic alert days
  UPDATE certifications SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= (current_date + (cert_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date <= current_date THEN 'expired'::document_status
    WHEN validity_date <= (current_date + (cert_alert_days || ' days')::interval) THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;

  -- Update technical attestations status with dynamic alert days
  UPDATE technical_attestations SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= (current_date + (tech_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date <= current_date THEN 'expired'::document_status
    WHEN validity_date <= (current_date + (tech_alert_days || ' days')::interval) THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;

  -- Update legal documents status with dynamic alert days
  UPDATE legal_documents SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= (current_date + (legal_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date <= current_date THEN 'expired'::document_status
    WHEN validity_date <= (current_date + (legal_alert_days || ' days')::interval) THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;
END;
$function$;