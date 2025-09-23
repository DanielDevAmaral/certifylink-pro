-- Extend get_alert_days function to support badges
CREATE OR REPLACE FUNCTION public.get_alert_days(document_type text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  alert_days integer := 30; -- default fallback for badges, 60 for others
  setting_key_name text;
BEGIN
  -- Map document type to setting key
  CASE document_type
    WHEN 'certification' THEN 
      setting_key_name := 'notifications.certification_alert_days';
      alert_days := 60; -- fallback for certifications
    WHEN 'technical_attestation' THEN 
      setting_key_name := 'notifications.technical_attestation_alert_days';
      alert_days := 60; -- fallback for technical attestations
    WHEN 'legal_document' THEN 
      setting_key_name := 'notifications.legal_document_alert_days';
      alert_days := 60; -- fallback for legal documents
    WHEN 'badge' THEN 
      setting_key_name := 'notifications.badge_alert_days';
      alert_days := 30; -- fallback for badges
    ELSE 
      setting_key_name := 'notifications.expiration_alert_days'; -- fallback to old setting
      alert_days := 60; -- general fallback
  END CASE;

  -- Get the configured value
  SELECT COALESCE((setting_value)::integer, alert_days) INTO alert_days
  FROM public.system_settings 
  WHERE setting_key = setting_key_name
  LIMIT 1;

  RETURN alert_days;
END;
$function$;

-- Extend update_document_status function to include badges
CREATE OR REPLACE FUNCTION public.update_document_status()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  cert_alert_days integer;
  tech_alert_days integer;
  legal_alert_days integer;
  badge_alert_days integer;
BEGIN
  -- Get alert days for each document type
  cert_alert_days := get_alert_days('certification');
  tech_alert_days := get_alert_days('technical_attestation');
  legal_alert_days := get_alert_days('legal_document');
  badge_alert_days := get_alert_days('badge');

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

  -- Update badges status with dynamic alert days
  UPDATE badges SET 
    status = CASE 
      WHEN expiry_date IS NULL THEN 'valid'::document_status
      WHEN expiry_date <= current_date THEN 'expired'::document_status
      WHEN expiry_date <= (current_date + (badge_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN expiry_date IS NULL THEN 'valid'::document_status
    WHEN expiry_date <= current_date THEN 'expired'::document_status
    WHEN expiry_date <= (current_date + (badge_alert_days || ' days')::interval) THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;
END;
$function$;

-- Create trigger function for badges (similar to existing one)
CREATE OR REPLACE FUNCTION public.update_badge_status_on_expiry_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  alert_days integer;
  new_status document_status;
BEGIN
  -- Get alert days for badges
  alert_days := get_alert_days('badge');

  -- Calculate the new status based on expiry_date and dynamic alert days
  IF NEW.expiry_date IS NULL THEN
    new_status := 'valid'::document_status;
  ELSIF NEW.expiry_date <= current_date THEN
    new_status := 'expired'::document_status;
  ELSIF NEW.expiry_date <= (current_date + (alert_days || ' days')::interval) THEN
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

-- Create trigger for badges table
DROP TRIGGER IF EXISTS update_badge_status_trigger ON badges;
CREATE TRIGGER update_badge_status_trigger
  BEFORE INSERT OR UPDATE OF expiry_date
  ON badges
  FOR EACH ROW
  EXECUTE FUNCTION update_badge_status_on_expiry_change();

-- Add default system setting for badge alert days
INSERT INTO public.system_settings (setting_key, setting_value, description, updated_by)
VALUES (
  'notifications.badge_alert_days',
  '30'::jsonb,
  'Número de dias antes do vencimento para alertar sobre badges expirando',
  NULL
) ON CONFLICT (setting_key) DO NOTHING;