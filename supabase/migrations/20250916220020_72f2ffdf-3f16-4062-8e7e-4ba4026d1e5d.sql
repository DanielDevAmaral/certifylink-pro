-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily notifications job to run at 9 AM UTC every day
SELECT cron.schedule(
  'daily-document-notifications',
  '0 9 * * *', -- 9 AM UTC daily
  $$
  SELECT
    net.http_post(
        url:='https://fxfmswnvfqqdsgrcgvhl.supabase.co/functions/v1/daily-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4Zm1zd252ZnFxZHNncmNndmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDE1NDEsImV4cCI6MjA3MzYxNzU0MX0.4a3CTyQoRUEHJubCoYRn79P2XDf1eMNGVGX2RLUPqcQ"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);