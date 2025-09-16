-- Create audit logging function
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
BEGIN
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
    auth.uid(),
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

-- Create audit triggers for important tables
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Add audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_certifications ON public.certifications;
CREATE TRIGGER audit_certifications
  AFTER INSERT OR UPDATE OR DELETE ON public.certifications
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_legal_documents ON public.legal_documents;
CREATE TRIGGER audit_legal_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_technical_attestations ON public.technical_attestations;  
CREATE TRIGGER audit_technical_attestations
  AFTER INSERT OR UPDATE OR DELETE ON public.technical_attestations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_teams ON public.teams;
CREATE TRIGGER audit_teams
  AFTER INSERT OR UPDATE OR DELETE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_team_members ON public.team_members;
CREATE TRIGGER audit_team_members
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();