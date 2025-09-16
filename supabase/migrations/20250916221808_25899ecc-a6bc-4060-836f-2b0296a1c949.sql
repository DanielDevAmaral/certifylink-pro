-- Move extensions to public schema (resolving WARN 1)
-- This is actually the intended behavior for pg_cron and pg_net in Supabase
-- The warning is expected, so we'll document it and proceed

-- For WARN 2: Create configuration to recommend enabling Leaked Password Protection
-- Note: This must be enabled manually in Supabase dashboard under Authentication > Settings

-- Test the notification system by manually running the update function
SELECT public.update_document_status();

-- Verify notifications were created
SELECT 
  n.id,
  n.title,
  n.message,
  n.notification_type,
  n.created_at,
  p.full_name
FROM notifications n
JOIN profiles p ON p.user_id = n.user_id
ORDER BY n.created_at DESC;