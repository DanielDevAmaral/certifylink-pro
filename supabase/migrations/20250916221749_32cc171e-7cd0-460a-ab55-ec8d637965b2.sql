-- Create test data with correct enum values
WITH test_user AS (
  SELECT user_id FROM profiles LIMIT 1
)
-- Insert test certifications
INSERT INTO certifications (
  user_id,
  name,
  function,
  validity_date,
  status,
  created_at
)
SELECT 
  tu.user_id,
  'Certificação AWS Solutions Architect',
  'Arquiteto de Soluções',
  CURRENT_DATE + INTERVAL '15 days',
  'valid',
  NOW()
FROM test_user tu
WHERE EXISTS (SELECT 1 FROM test_user)
ON CONFLICT DO NOTHING;

WITH test_user AS (
  SELECT user_id FROM profiles LIMIT 1
)
-- Insert test technical attestation
INSERT INTO technical_attestations (
  user_id,
  project_object,
  client_name,
  issuer_name,
  validity_date,
  status,
  created_at
)
SELECT 
  tu.user_id,
  'Desenvolvimento Sistema ERP Corporativo',
  'Empresa XYZ Ltda',
  'João Silva - CTO',
  CURRENT_DATE + INTERVAL '20 days',
  'valid',
  NOW()
FROM test_user tu
WHERE EXISTS (SELECT 1 FROM test_user)
ON CONFLICT DO NOTHING;

WITH test_user AS (
  SELECT user_id FROM profiles LIMIT 1
)
-- Insert test legal document with correct enum
INSERT INTO legal_documents (
  user_id,
  document_name,
  document_type,
  validity_date,
  status,
  document_url,
  created_at
)
SELECT 
  tu.user_id,
  'Contrato de Prestação de Serviços - Cliente ABC',
  'licensing',
  CURRENT_DATE + INTERVAL '10 days',
  'valid',
  'https://example.com/doc1.pdf',
  NOW()
FROM test_user tu
WHERE EXISTS (SELECT 1 FROM test_user)
ON CONFLICT DO NOTHING;