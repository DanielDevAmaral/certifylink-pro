-- Create helper function to get alert days by document type
CREATE OR REPLACE FUNCTION public.get_alert_days(document_type text)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  alert_days integer := 60; -- default fallback
  setting_key text;
BEGIN
  -- Map document type to setting key
  CASE document_type
    WHEN 'certification' THEN setting_key := 'notifications.certification_alert_days';
    WHEN 'technical_attestation' THEN setting_key := 'notifications.technical_attestation_alert_days';
    WHEN 'legal_document' THEN setting_key := 'notifications.legal_document_alert_days';
    ELSE setting_key := 'notifications.expiration_alert_days'; -- fallback to old setting
  END CASE;

  -- Get the configured value
  SELECT COALESCE((setting_value)::integer, 60) INTO alert_days
  FROM public.system_settings 
  WHERE setting_key = setting_key
  LIMIT 1;

  RETURN alert_days;
END;
$function$

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

  -- Insert default settings if they don't exist
  INSERT INTO public.system_settings (setting_key, setting_value, description)
  VALUES 
    ('notifications.certification_alert_days', '60', 'Dias antes do vencimento para alertar sobre certificações'),
    ('notifications.technical_attestation_alert_days', '45', 'Dias antes do vencimento para alertar sobre atestados técnicos'),
    ('notifications.legal_document_alert_days', '30', 'Dias antes do vencimento para alertar sobre documentos legais')
  ON CONFLICT (setting_key) DO NOTHING;
END;
$function$

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