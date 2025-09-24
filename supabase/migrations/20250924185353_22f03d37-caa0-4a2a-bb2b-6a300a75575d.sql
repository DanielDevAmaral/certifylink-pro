-- Step 1: Manually fix the "Meus Testes" user documents
UPDATE certifications 
SET status = 'deactivated'::document_status, updated_at = NOW()
WHERE user_id = 'd1fc0791-46e4-4f90-a05e-9a2a76e064aa' AND status != 'deactivated'::document_status;

UPDATE badges 
SET status = 'deactivated'::document_status, updated_at = NOW()
WHERE user_id = 'd1fc0791-46e4-4f90-a05e-9a2a76e064aa' AND status != 'deactivated'::document_status;

UPDATE technical_attestations 
SET status = 'deactivated'::document_status, updated_at = NOW()
WHERE user_id = 'd1fc0791-46e4-4f90-a05e-9a2a76e064aa' AND status != 'deactivated'::document_status;

UPDATE legal_documents 
SET status = 'deactivated'::document_status, updated_at = NOW()
WHERE user_id = 'd1fc0791-46e4-4f90-a05e-9a2a76e064aa' AND status != 'deactivated'::document_status;

-- Step 2: Improve the automatic status update function to respect deactivated status
CREATE OR REPLACE FUNCTION public.update_document_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Update certifications status with dynamic alert days (EXCLUDING deactivated ones)
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

  -- Update technical attestations status with dynamic alert days (EXCLUDING deactivated ones)
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

  -- Update legal documents status with dynamic alert days (EXCLUDING deactivated ones)
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

  -- Update badges status with dynamic alert days (EXCLUDING deactivated ones)
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
$function$;

-- Step 3: Improve the validity change triggers to respect deactivated status
CREATE OR REPLACE FUNCTION public.update_status_on_validity_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  alert_days integer;
  new_status document_status;
  doc_type text;
BEGIN
  -- Skip processing if document is deactivated
  IF NEW.status = 'deactivated'::document_status THEN
    RETURN NEW;
  END IF;

  -- Determine document type based on table name
  CASE TG_TABLE_NAME
    WHEN 'certifications' THEN doc_type := 'certification';
    WHEN 'technical_attestations' THEN doc_type := 'technical_attestation';
    WHEN 'legal_documents' THEN doc_type := 'legal_document';
    ELSE doc_type := 'certification'; -- fallback
  END CASE;

  -- Get alert days for this document type
  alert_days := get_alert_days(doc_type);

  -- Calculate the new status based on validity_date and dynamic alert days
  IF NEW.validity_date IS NULL THEN
    new_status := 'valid'::document_status;
  ELSIF NEW.validity_date <= current_date THEN
    new_status := 'expired'::document_status;
  ELSIF NEW.validity_date <= (current_date + (alert_days || ' days')::interval) THEN
    new_status := 'expiring'::document_status;
  ELSE
    new_status := 'valid'::document_status;
  END IF;

  -- Update the status if it changed
  NEW.status := new_status;
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$function$;

-- Step 4: Improve the badge expiry change trigger to respect deactivated status
CREATE OR REPLACE FUNCTION public.update_badge_status_on_expiry_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  alert_days integer;
  new_status document_status;
BEGIN
  -- Skip processing if badge is deactivated
  IF NEW.status = 'deactivated'::document_status THEN
    RETURN NEW;
  END IF;

  -- Get alert days for badges
  alert_days := get_alert_days('badge');

  -- Calculate the new status based on expiry_date and dynamic alert days
  IF NEW.expiry_date IS NULL THEN
    new_status := 'valid'::document_status;
  ELSIF NEW.expiry_date <= current_date THEN
    new_status := 'expired'::document_status;
  ELSIF NEW.expiry_date <= (current_date + (alert_days || ' days')::interval) THEN
    new_status := 'expiring'::document_status;
  ELSE
    new_status := 'valid'::document_status;
  END IF;

  -- Update the status if it changed
  NEW.status := new_status;
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$function$;

-- Step 5: Improve the user deactivation function with better logging
CREATE OR REPLACE FUNCTION public.handle_user_deactivation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  docs_updated integer := 0;
  total_docs integer := 0;
BEGIN
  -- If user is being deactivated (inactive, suspended, terminated)
  IF NEW.status IN ('inactive', 'suspended', 'terminated') AND OLD.status = 'active' THEN
    -- Count total documents before deactivation
    SELECT COUNT(*) INTO total_docs
    FROM (
      SELECT id FROM certifications WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status
      UNION ALL
      SELECT id FROM badges WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status
      UNION ALL  
      SELECT id FROM technical_attestations WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status
      UNION ALL
      SELECT id FROM legal_documents WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status
    ) as all_docs;

    -- Deactivate all user certifications (except already deactivated ones)
    UPDATE certifications 
    SET status = 'deactivated'::document_status, updated_at = NOW()
    WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status;
    
    GET DIAGNOSTICS docs_updated = ROW_COUNT;
    
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
    
    -- Log the deactivation in audit logs with more details
    PERFORM log_audit_event(
      'user_documents',
      NEW.user_id,
      'DEACTIVATE_USER_DOCUMENTS',
      jsonb_build_object('old_status', OLD.status, 'total_docs_found', total_docs),
      jsonb_build_object('new_status', NEW.status, 'reason', NEW.deactivation_reason, 'docs_processed', total_docs)
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
$function$;