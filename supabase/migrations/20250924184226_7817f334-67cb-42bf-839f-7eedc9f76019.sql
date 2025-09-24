-- Add 'deactivated' status to document_status enum
ALTER TYPE document_status ADD VALUE 'deactivated';

-- Function to deactivate user documents when user status changes
CREATE OR REPLACE FUNCTION public.handle_user_deactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If user is being deactivated (inactive, suspended, terminated)
  IF NEW.status IN ('inactive', 'suspended', 'terminated') AND OLD.status = 'active' THEN
    -- Deactivate all user certifications (except already deactivated ones)
    UPDATE certifications 
    SET status = 'deactivated'::document_status, updated_at = NOW()
    WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status;
    
    -- Deactivate all user badges (except already deactivated ones)
    UPDATE badges 
    SET status = 'deactivated'::document_status, updated_at = NOW()
    WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status;
    
    -- Deactivate all user technical attestations (except already deactivated ones)
    UPDATE technical_attestations 
    SET status = 'deactivated'::document_status, updated_at = NOW()
    WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status;
    
    -- Deactivate all user legal documents (except already deactivated ones)
    UPDATE legal_documents 
    SET status = 'deactivated'::document_status, updated_at = NOW()
    WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status;
    
    -- Log the deactivation in audit logs
    PERFORM log_audit_event(
      'user_documents',
      NEW.user_id,
      'DEACTIVATE_USER_DOCUMENTS',
      jsonb_build_object('old_status', OLD.status),
      jsonb_build_object('new_status', NEW.status, 'reason', NEW.deactivation_reason)
    );
    
  -- If user is being reactivated
  ELSIF NEW.status = 'active' AND OLD.status IN ('inactive', 'suspended', 'terminated') THEN
    -- Reactivate all user documents by updating their status based on validity dates
    -- This will use the existing status calculation logic
    
    -- Update certifications
    UPDATE certifications SET 
      status = CASE 
        WHEN validity_date IS NULL THEN 'valid'::document_status
        WHEN validity_date <= CURRENT_DATE THEN 'expired'::document_status
        WHEN validity_date <= (CURRENT_DATE + (get_alert_days('certification') || ' days')::interval) THEN 'expiring'::document_status
        ELSE 'valid'::document_status
      END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND status = 'deactivated'::document_status;
    
    -- Update badges
    UPDATE badges SET 
      status = CASE 
        WHEN expiry_date IS NULL THEN 'valid'::document_status
        WHEN expiry_date <= CURRENT_DATE THEN 'expired'::document_status
        WHEN expiry_date <= (CURRENT_DATE + (get_alert_days('badge') || ' days')::interval) THEN 'expiring'::document_status
        ELSE 'valid'::document_status
      END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND status = 'deactivated'::document_status;
    
    -- Update technical attestations
    UPDATE technical_attestations SET 
      status = CASE 
        WHEN validity_date IS NULL THEN 'valid'::document_status
        WHEN validity_date <= CURRENT_DATE THEN 'expired'::document_status
        WHEN validity_date <= (CURRENT_DATE + (get_alert_days('technical_attestation') || ' days')::interval) THEN 'expiring'::document_status
        ELSE 'valid'::document_status
      END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND status = 'deactivated'::document_status;
    
    -- Update legal documents
    UPDATE legal_documents SET 
      status = CASE 
        WHEN validity_date IS NULL THEN 'valid'::document_status
        WHEN validity_date <= CURRENT_DATE THEN 'expired'::document_status
        WHEN validity_date <= (CURRENT_DATE + (get_alert_days('legal_document') || ' days')::interval) THEN 'expiring'::document_status
        ELSE 'valid'::document_status
      END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND status = 'deactivated'::document_status;
    
    -- Log the reactivation in audit logs
    PERFORM log_audit_event(
      'user_documents',
      NEW.user_id,
      'REACTIVATE_USER_DOCUMENTS',
      jsonb_build_object('old_status', OLD.status),
      jsonb_build_object('new_status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table to handle user status changes
CREATE TRIGGER user_deactivation_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_user_deactivation();

-- Update the existing update_document_status function to handle deactivated status
CREATE OR REPLACE FUNCTION public.update_document_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_date date := CURRENT_DATE;
  cert_alert_days integer;
  tech_alert_days integer;
  legal_alert_days integer;
  badge_alert_days integer;
BEGIN
  -- Get alert days for each document type
  cert_alert_days := get_alert_days('certification');
  tech_alert_days := get_alert_days('technical_attestation');
  legal_alert_days := get_alert_days('legal_document');
  badge_alert_days := get_alert_days('badge');

  -- Update certifications status with dynamic alert days (excluding deactivated ones)
  UPDATE certifications SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= (current_date + (cert_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != 'deactivated'::document_status 
    AND status != CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= (current_date + (cert_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END;

  -- Update technical attestations status with dynamic alert days (excluding deactivated ones)
  UPDATE technical_attestations SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= (current_date + (tech_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != 'deactivated'::document_status 
    AND status != CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= (current_date + (tech_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END;

  -- Update legal documents status with dynamic alert days (excluding deactivated ones)
  UPDATE legal_documents SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= (current_date + (legal_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != 'deactivated'::document_status 
    AND status != CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= (current_date + (legal_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END;

  -- Update badges status with dynamic alert days (excluding deactivated ones)
  UPDATE badges SET 
    status = CASE 
      WHEN expiry_date IS NULL THEN 'valid'::document_status
      WHEN expiry_date <= current_date THEN 'expired'::document_status
      WHEN expiry_date <= (current_date + (badge_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != 'deactivated'::document_status 
    AND status != CASE 
      WHEN expiry_date IS NULL THEN 'valid'::document_status
      WHEN expiry_date <= current_date THEN 'expired'::document_status
      WHEN expiry_date <= (current_date + (badge_alert_days || ' days')::interval) THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END;
END;
$$;