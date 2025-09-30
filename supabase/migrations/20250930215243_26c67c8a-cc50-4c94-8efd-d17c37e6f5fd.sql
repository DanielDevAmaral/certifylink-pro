-- Modify log_audit_event function to ignore master user actions
-- Master user ID: 00000000-0000-0000-0000-000000000000
-- This ensures the master user leaves zero traces in audit logs

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_table_name text, 
  p_record_id uuid, 
  p_action text, 
  p_old_values jsonb DEFAULT NULL::jsonb, 
  p_new_values jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  audit_id uuid;
  user_agent text;
  ip_address text;
  current_user_id uuid;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- If the user is the master user, do not log anything
  IF current_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RETURN NULL; -- Return NULL to indicate no log was created
  END IF;

  -- Get user agent from request headers if available
  user_agent := current_setting('request.headers', true)::json->>'user-agent';
  
  -- Get IP address from request headers if available  
  ip_address := current_setting('request.headers', true)::json->>'x-forwarded-for';

  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    user_agent,
    ip_address
  ) VALUES (
    current_user_id,
    p_table_name,
    p_record_id,
    p_action,
    p_old_values,
    p_new_values,
    user_agent,
    ip_address::inet
  )
  RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$function$;