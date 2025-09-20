-- Remove obsolete email notification settings from system_settings
DELETE FROM public.system_settings 
WHERE setting_key IN (
  'notifications.email_notifications',
  'notifications.leader_notifications'
);