-- Populate system_settings table with default values
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('ai.provider', '"openai"', 'AI provider for suggestions'),
  ('ai.api_key', '""', 'API key for AI provider'),
  ('ai.prompt_template', '"Analise a certificação e sugira serviços equivalentes baseado na experiência e competências demonstradas."', 'Template for AI prompts'),
  ('ai.auto_suggestions', 'true', 'Enable automatic AI suggestions'),
  ('notifications.expiration_alert_days', '30', 'Days before expiration to alert'),
  ('notifications.email_notifications', 'true', 'Enable email notifications'),
  ('notifications.leader_notifications', 'true', 'Enable notifications to team leaders'),
  ('export.company_name', '"Minha Empresa"', 'Company name for exports'),
  ('export.logo_url', '""', 'Company logo URL for exports'),
  ('export.footer_text', '"Documento gerado automaticamente pelo sistema de gestão documental"', 'Footer text for exports'),
  ('export.cover_template', '"standard"', 'Cover template for exports'),
  ('export.auto_toc', 'true', 'Auto-generate table of contents'),
  ('security.data_encryption', 'true', 'Enable data encryption for sensitive data'),
  ('security.audit_logging', 'true', 'Enable audit logging'),
  ('security.sensitive_access', 'false', 'Restrict sensitive data access to admins only'),
  ('security.session_timeout', '8', 'Session timeout in hours')
ON CONFLICT (setting_key) DO NOTHING;