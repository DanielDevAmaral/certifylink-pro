-- Use correct enum values for document_status
WITH test_user AS (
  SELECT user_id FROM profiles LIMIT 1
)
-- Insert test certifications with different validity dates
INSERT INTO certifications (
  id,
  user_id,
  name,
  function,
  validity_date,
  status,
  created_at
)
SELECT 
  gen_random_uuid(),
  tu.user_id,
  'Certificação AWS Solutions Architect',
  'Arquiteto de Soluções',
  CURRENT_DATE + INTERVAL '15 days',
  'valid',
  NOW()
FROM test_user tu
WHERE NOT EXISTS (
  SELECT 1 FROM certifications c 
  WHERE c.user_id = tu.user_id 
    AND c.name = 'Certificação AWS Solutions Architect'
);

WITH test_user AS (
  SELECT user_id FROM profiles LIMIT 1
)
INSERT INTO certifications (
  id,
  user_id,
  name,
  function,
  validity_date,
  status,
  created_at
)
SELECT 
  gen_random_uuid(),
  tu.user_id,
  'Certificação PMP',
  'Gerente de Projetos',
  CURRENT_DATE + INTERVAL '25 days',
  'valid',
  NOW()
FROM test_user tu
WHERE NOT EXISTS (
  SELECT 1 FROM certifications c 
  WHERE c.user_id = tu.user_id 
    AND c.name = 'Certificação PMP'
);

WITH test_user AS (
  SELECT user_id FROM profiles LIMIT 1
)
-- Insert test technical attestation
INSERT INTO technical_attestations (
  id,
  user_id,
  project_object,
  client_name,
  issuer_name,
  validity_date,
  status,
  created_at
)
SELECT 
  gen_random_uuid(),
  tu.user_id,
  'Desenvolvimento Sistema ERP Corporativo',
  'Empresa XYZ Ltda',
  'João Silva - CTO',
  CURRENT_DATE + INTERVAL '20 days',
  'valid',
  NOW()
FROM test_user tu
WHERE NOT EXISTS (
  SELECT 1 FROM technical_attestations ta 
  WHERE ta.user_id = tu.user_id 
    AND ta.project_object = 'Desenvolvimento Sistema ERP Corporativo'
);

WITH test_user AS (
  SELECT user_id FROM profiles LIMIT 1
)
-- Insert test legal document
INSERT INTO legal_documents (
  id,
  user_id,
  document_name,
  document_type,
  validity_date,
  status,
  document_url,
  created_at
)
SELECT 
  gen_random_uuid(),
  tu.user_id,
  'Contrato de Prestação de Serviços - Cliente ABC',
  'contract',
  CURRENT_DATE + INTERVAL '10 days',
  'valid',
  'https://example.com/doc1.pdf',
  NOW()
FROM test_user tu
WHERE NOT EXISTS (
  SELECT 1 FROM legal_documents ld 
  WHERE ld.user_id = tu.user_id 
    AND ld.document_name = 'Contrato de Prestação de Serviços - Cliente ABC'
);