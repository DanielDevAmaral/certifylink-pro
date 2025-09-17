-- Fix create_test_data() function to use correct enum values
CREATE OR REPLACE FUNCTION public.create_test_data()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 'Error: User not authenticated';
  END IF;

  -- Insert test certifications with different validity dates
  INSERT INTO certifications (user_id, name, function, validity_date, status) VALUES
  -- Expiring soon (next 30 days)
  (current_user_id, 'Certificação ISO 9001', 'Gestão da Qualidade', CURRENT_DATE + INTERVAL '15 days', 'expiring'),
  (current_user_id, 'Certificação PMBOK', 'Gestão de Projetos', CURRENT_DATE + INTERVAL '25 days', 'expiring'),
  -- Already expired
  (current_user_id, 'Certificação Antiga', 'Processo Desatualizado', CURRENT_DATE - INTERVAL '10 days', 'expired'),
  -- Valid for longer period
  (current_user_id, 'Certificação AWS Solutions Architect', 'Cloud Computing', CURRENT_DATE + INTERVAL '14 days', 'expiring');

  -- Insert test technical attestations
  INSERT INTO technical_attestations (
    user_id, client_name, project_object, issuer_name, 
    validity_date, status, project_value, project_period_start, project_period_end
  ) VALUES
  -- Expiring soon
  (current_user_id, 'Empresa ABC', 'Sistema de Gestão Financeira', 'João Silva', 
   CURRENT_DATE + INTERVAL '20 days', 'expiring', 150000.00, 
   CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE - INTERVAL '3 months'),
  -- Already expired
  (current_user_id, 'Empresa XYZ', 'Portal de E-commerce', 'Maria Santos', 
   CURRENT_DATE - INTERVAL '5 days', 'expired', 85000.00, 
   CURRENT_DATE - INTERVAL '12 months', CURRENT_DATE - INTERVAL '8 months');

  -- Insert test legal documents using correct enum values
  INSERT INTO legal_documents (
    user_id, document_name, document_type, document_subtype, validity_date, 
    status, document_url, is_sensitive
  ) VALUES
  -- Expiring soon
  (current_user_id, 'Qualificação Técnica Legal', 'legal_qualification', 'Contrato de Prestação de Serviços',
   CURRENT_DATE + INTERVAL '10 days', 'expiring', '/docs/contrato-prestacao.pdf', false),
  -- Already expired
  (current_user_id, 'Regularidade Fiscal', 'fiscal_regularity', 'Licença de Software',
   CURRENT_DATE - INTERVAL '3 days', 'expired', '/docs/licenca-software.pdf', false),
  -- Valid
  (current_user_id, 'Capacidade Econômico-Financeira', 'economic_financial', 'Acordo de Confidencialidade',
   CURRENT_DATE + INTERVAL '365 days', 'valid', '/docs/nda.pdf', true);

  -- Create a test notification to verify the system
  INSERT INTO notifications (user_id, title, message, notification_type, related_document_type) VALUES
  (current_user_id, 'Sistema de Notificações Ativo', 
   'O sistema de notificações foi configurado e está funcionando corretamente.', 
   'info', 'certification');

  RETURN 'Test data created successfully for user: ' || current_user_id;
END;
$function$;

-- Fix update_document_status() function to use correct enum values
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

  -- Create notifications for documents expiring soon using correct enum values
  INSERT INTO notifications (user_id, title, message, notification_type, related_document_type)
  SELECT DISTINCT 
    c.user_id,
    'Certificação Vencendo em Breve',
    'Sua certificação "' || c.name || '" vence em ' || (c.validity_date - current_date) || ' dias.',
    'warning',
    'certification'::document_category
  FROM certifications c
  WHERE c.status = 'expiring'
    AND c.validity_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = c.user_id 
        AND n.related_document_type = 'certification'::document_category
        AND n.created_at::date = current_date
        AND n.message LIKE '%' || c.name || '%'
    );

  INSERT INTO notifications (user_id, title, message, notification_type, related_document_type)
  SELECT DISTINCT 
    ta.user_id,
    'Atestado Técnico Vencendo em Breve',
    'Seu atestado técnico "' || ta.project_object || '" vence em ' || (ta.validity_date - current_date) || ' dias.',
    'warning',
    'technical_attestation'::document_category
  FROM technical_attestations ta
  WHERE ta.status = 'expiring' 
    AND ta.validity_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = ta.user_id 
        AND n.related_document_type = 'technical_attestation'::document_category
        AND n.created_at::date = current_date
        AND n.message LIKE '%' || ta.project_object || '%'
    );

  INSERT INTO notifications (user_id, title, message, notification_type, related_document_type)
  SELECT DISTINCT 
    ld.user_id,
    'Documento Jurídico Vencendo em Breve',
    'Seu documento "' || ld.document_name || '" vence em ' || (ld.validity_date - current_date) || ' dias.',
    'warning',
    'legal_document'::document_category
  FROM legal_documents ld
  WHERE ld.status = 'expiring'
    AND ld.validity_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = ld.user_id 
        AND n.related_document_type = 'legal_document'::document_category
        AND n.created_at::date = current_date
        AND n.message LIKE '%' || ld.document_name || '%'
    );
    
END;
$function$;