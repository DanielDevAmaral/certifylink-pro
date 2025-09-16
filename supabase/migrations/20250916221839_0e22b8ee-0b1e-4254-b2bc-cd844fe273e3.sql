-- Simple test data creation with correct enums
WITH test_user AS (
  SELECT user_id FROM profiles LIMIT 1
)
-- Insert minimal test data for testing notifications
INSERT INTO certifications (user_id, name, function, validity_date, status)
SELECT 
  tu.user_id,
  'Certificação AWS Test',
  'Teste Function',
  CURRENT_DATE + INTERVAL '15 days',
  'valid'
FROM test_user tu
ON CONFLICT DO NOTHING;

WITH test_user AS (
  SELECT user_id FROM profiles LIMIT 1
)
INSERT INTO legal_documents (user_id, document_name, document_type, validity_date, status, document_url)
SELECT 
  tu.user_id,
  'Documento Teste Legal',
  'legal_qualification',
  CURRENT_DATE + INTERVAL '10 days',
  'valid',
  'https://example.com/test.pdf'
FROM test_user tu
ON CONFLICT DO NOTHING;