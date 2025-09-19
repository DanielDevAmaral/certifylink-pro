-- Create helper function to get alert days by document type
CREATE OR REPLACE FUNCTION public.get_alert_days(document_type text)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  alert_days integer := 60; -- default fallback
  setting_key_name text;
BEGIN
  -- Map document type to setting key
  CASE document_type
    WHEN 'certification' THEN setting_key_name := 'notifications.certification_alert_days';
    WHEN 'technical_attestation' THEN setting_key_name := 'notifications.technical_attestation_alert_days';
    WHEN 'legal_document' THEN setting_key_name := 'notifications.legal_document_alert_days';
    ELSE setting_key_name := 'notifications.expiration_alert_days'; -- fallback to old setting
  END CASE;

  -- Get the configured value
  SELECT COALESCE((setting_value)::integer, 60) INTO alert_days
  FROM public.system_settings 
  WHERE setting_key = setting_key_name
  LIMIT 1;

  RETURN alert_days;
END;
$function$;

-- Insert default settings if they don't exist
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('notifications.certification_alert_days', '60', 'Dias antes do vencimento para alertar sobre certificações'),
  ('notifications.technical_attestation_alert_days', '45', 'Dias antes do vencimento para alertar sobre atestados técnicos'),
  ('notifications.legal_document_alert_days', '30', 'Dias antes do vencimento para alertar sobre documentos legais')
ON CONFLICT (setting_key) DO NOTHING;