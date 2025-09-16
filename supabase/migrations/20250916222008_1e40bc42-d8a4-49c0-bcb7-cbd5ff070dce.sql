-- Fix the update_document_status function to use correct enum values
CREATE OR REPLACE FUNCTION public.update_document_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  thirty_days_future date := CURRENT_DATE + INTERVAL '30 days';
BEGIN
  -- Update certifications status using correct enum values
  UPDATE certifications SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date < current_date THEN 'expired'::document_status
      WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date < current_date THEN 'expired'::document_status
    WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;

  -- Update technical attestations status
  UPDATE technical_attestations SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date < current_date THEN 'expired'::document_status
      WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date < current_date THEN 'expired'::document_status
    WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;

  -- Update legal documents status  
  UPDATE legal_documents SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date < current_date THEN 'expired'::document_status
      WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date < current_date THEN 'expired'::document_status
    WHEN validity_date <= thirty_days_future THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;

  -- Create notifications for documents expiring soon
  INSERT INTO notifications (user_id, title, message, notification_type, related_document_type)
  SELECT DISTINCT 
    c.user_id,
    'Certificação Vencendo em Breve',
    'Sua certificação "' || c.name || '" vence em ' || (c.validity_date - current_date) || ' dias.',
    'warning',
    'certification'
  FROM certifications c
  WHERE c.status = 'expiring'
    AND c.validity_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = c.user_id 
        AND n.related_document_type = 'certification'
        AND n.created_at::date = current_date
        AND n.message LIKE '%' || c.name || '%'
    );

  INSERT INTO notifications (user_id, title, message, notification_type, related_document_type)
  SELECT DISTINCT 
    ta.user_id,
    'Atestado Técnico Vencendo em Breve',
    'Seu atestado técnico "' || ta.project_object || '" vence em ' || (ta.validity_date - current_date) || ' dias.',
    'warning',
    'attestation'
  FROM technical_attestations ta
  WHERE ta.status = 'expiring' 
    AND ta.validity_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = ta.user_id 
        AND n.related_document_type = 'attestation'
        AND n.created_at::date = current_date
        AND n.message LIKE '%' || ta.project_object || '%'
    );

  INSERT INTO notifications (user_id, title, message, notification_type, related_document_type)
  SELECT DISTINCT 
    ld.user_id,
    'Documento Jurídico Vencendo em Breve',
    'Seu documento "' || ld.document_name || '" vence em ' || (ld.validity_date - current_date) || ' dias.',
    'warning',
    'document'
  FROM legal_documents ld
  WHERE ld.status = 'expiring'
    AND ld.validity_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = ld.user_id 
        AND n.related_document_type = 'document'
        AND n.created_at::date = current_date
        AND n.message LIKE '%' || ld.document_name || '%'
    );
    
END;
$function$;