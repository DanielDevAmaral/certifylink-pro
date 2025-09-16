-- Create test data with expiring documents for testing notifications
-- First, let's create a test user profile if it doesn't exist
INSERT INTO profiles (user_id, full_name, email) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Test User', 'test@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- Insert test certifications with different validity dates
INSERT INTO certifications (
  id,
  user_id,
  name,
  function,
  validity_date,
  status,
  created_at
) VALUES 
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'Certificação AWS Solutions Architect',
  'Arquiteto de Soluções',
  CURRENT_DATE + INTERVAL '15 days',
  'expiring_soon',
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'Certificação PMP',
  'Gerente de Projetos',
  CURRENT_DATE + INTERVAL '25 days',
  'expiring_soon',
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'Certificação CISSP',
  'Especialista em Segurança',
  CURRENT_DATE - INTERVAL '5 days',
  'expired',
  NOW() - INTERVAL '1 month'
)
ON CONFLICT (id) DO NOTHING;

-- Insert test technical attestations
INSERT INTO technical_attestations (
  id,
  user_id,
  project_object,
  client_name,
  issuer_name,
  validity_date,
  status,
  created_at
) VALUES 
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'Desenvolvimento Sistema ERP Corporativo',
  'Empresa XYZ Ltda',
  'João Silva - CTO',
  CURRENT_DATE + INTERVAL '20 days',
  'expiring_soon',
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'Implementação Infraestrutura Cloud',
  'TechCorp Inc',
  'Maria Santos - Diretora Técnica',
  CURRENT_DATE + INTERVAL '35 days',
  'valid',
  NOW() - INTERVAL '2 weeks'
)
ON CONFLICT (id) DO NOTHING;

-- Insert test legal documents  
INSERT INTO legal_documents (
  id,
  user_id,
  document_name,
  document_type,
  validity_date,
  status,
  document_url,
  created_at
) VALUES 
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'Contrato de Prestação de Serviços - Cliente ABC',
  'contract',
  CURRENT_DATE + INTERVAL '10 days',
  'expiring_soon',
  'https://example.com/doc1.pdf',
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'Acordo de Confidencialidade - Projeto Alpha',
  'nda',
  CURRENT_DATE + INTERVAL '45 days',
  'valid',
  'https://example.com/doc2.pdf',
  NOW() - INTERVAL '1 week'
)
ON CONFLICT (id) DO NOTHING;