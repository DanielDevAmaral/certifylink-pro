-- Revert get_user_role function to remove master user special handling
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1);
END;
$$;

-- Revert log_audit_event function to remove master user exclusion
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_table_name text,
  p_record_id uuid,
  p_action text,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  audit_id uuid;
  user_agent text;
  ip_address text;
  current_user_id uuid;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();

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
$$;