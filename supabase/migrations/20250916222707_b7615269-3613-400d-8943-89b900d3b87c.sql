-- Fix security warning: Move extensions from public to extensions schema
-- First drop from public schema if they exist
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

-- Create extensions in the correct schema
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Recreate the cron jobs with correct schema references
SELECT extensions.cron.schedule(
  'daily-document-status-update',
  '0 6 * * *', -- Every day at 6 AM UTC
  $$
  SELECT public.update_document_status();
  $$
);

SELECT extensions.cron.schedule(
  'daily-notifications-trigger',
  '0 7 * * *', -- Every day at 7 AM UTC
  $$
  SELECT
    extensions.net.http_post(
        url:='https://fxfmswnvfqqdsgrcgvhl.supabase.co/functions/v1/daily-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4Zm1zd252ZnFxZHNncmNndmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDE1NDEsImV4cCI6MjA3MzYxNzU0MX0.4a3CTyQoRUEHJubCoYRn79P2XDf1eMNGVGX2RLUPqcQ"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);