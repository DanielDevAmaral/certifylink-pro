-- Phase 1: Security Corrections and Setup
-- Enable required extensions in correct schema
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Configure cron job to run update_document_status daily at 6 AM UTC
SELECT cron.schedule(
  'daily-document-status-update',
  '0 6 * * *', -- Every day at 6 AM UTC
  $$
  SELECT public.update_document_status();
  $$
);

-- Configure cron job to trigger daily notifications at 7 AM UTC
SELECT cron.schedule(
  'daily-notifications-trigger',
  '0 7 * * *', -- Every day at 7 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://fxfmswnvfqqdsgrcgvhl.supabase.co/functions/v1/daily-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4Zm1zd252ZnFxZHNncmNndmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDE1NDEsImV4cCI6MjA3MzYxNzU0MX0.4a3CTyQoRUEHJubCoYRn79P2XDf1eMNGVGX2RLUPqcQ"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Phase 2: Create comprehensive test data
-- Insert test certifications with different validity dates
INSERT INTO certifications (user_id, name, function, validity_date, status) VALUES
-- Expiring soon (next 30 days)
((SELECT auth.uid()), 'Certificação ISO 9001', 'Gestão da Qualidade', CURRENT_DATE + INTERVAL '15 days', 'expiring'),
((SELECT auth.uid()), 'Certificação PMBOK', 'Gestão de Projetos', CURRENT_DATE + INTERVAL '25 days', 'expiring'),
-- Already expired
((SELECT auth.uid()), 'Certificação Antiga', 'Processo Desatualizado', CURRENT_DATE - INTERVAL '10 days', 'expired'),
-- Valid for longer period
((SELECT auth.uid()), 'Certificação AWS', 'Cloud Computing', CURRENT_DATE + INTERVAL '180 days', 'valid');

-- Insert test technical attestations
INSERT INTO technical_attestations (
  user_id, client_name, project_object, issuer_name, 
  validity_date, status, project_value, project_period_start, project_period_end
) VALUES
-- Expiring soon
((SELECT auth.uid()), 'Empresa ABC', 'Sistema de Gestão Financeira', 'João Silva', 
 CURRENT_DATE + INTERVAL '20 days', 'expiring', 150000.00, 
 CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE - INTERVAL '3 months'),
-- Already expired
((SELECT auth.uid()), 'Empresa XYZ', 'Portal de E-commerce', 'Maria Santos', 
 CURRENT_DATE - INTERVAL '5 days', 'expired', 85000.00, 
 CURRENT_DATE - INTERVAL '12 months', CURRENT_DATE - INTERVAL '8 months');

-- Insert test legal documents
INSERT INTO legal_documents (
  user_id, document_name, document_type, validity_date, 
  status, document_url, is_sensitive
) VALUES
-- Expiring soon
((SELECT auth.uid()), 'Contrato de Prestação de Serviços', 'contract', 
 CURRENT_DATE + INTERVAL '10 days', 'expiring', '/docs/contrato-prestacao.pdf', false),
-- Already expired
((SELECT auth.uid()), 'Licença de Software', 'license', 
 CURRENT_DATE - INTERVAL '3 days', 'expired', '/docs/licenca-software.pdf', false),
-- Valid
((SELECT auth.uid()), 'Acordo de Confidencialidade', 'nda', 
 CURRENT_DATE + INTERVAL '365 days', 'valid', '/docs/nda.pdf', true);

-- Create a test notification to verify the system
INSERT INTO notifications (user_id, title, message, notification_type, related_document_type) VALUES
((SELECT auth.uid()), 'Sistema de Notificações Ativo', 
 'O sistema de notificações foi configurado e está funcionando corretamente.', 
 'info', 'certification');