-- Update the trigger function to use 60 days instead of 30 days
CREATE OR REPLACE FUNCTION public.update_status_on_validity_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  sixty_days_future date := CURRENT_DATE + INTERVAL '60 days';
  new_status document_status;
BEGIN
  -- Calculate the new status based on validity_date (60 days logic)
  IF NEW.validity_date IS NULL THEN
    new_status := 'valid'::document_status;
  ELSIF NEW.validity_date <= current_date THEN
    new_status := 'expired'::document_status;
  ELSIF NEW.validity_date <= sixty_days_future THEN
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

-- Update the batch status update function to use 60 days
CREATE OR REPLACE FUNCTION public.update_document_status()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  sixty_days_future date := CURRENT_DATE + INTERVAL '60 days';
BEGIN
  -- Update certifications status with 60 days logic
  UPDATE certifications SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= sixty_days_future THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date <= current_date THEN 'expired'::document_status
    WHEN validity_date <= sixty_days_future THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;

  -- Update technical attestations status with 60 days logic
  UPDATE technical_attestations SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= sixty_days_future THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date <= current_date THEN 'expired'::document_status
    WHEN validity_date <= sixty_days_future THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;

  -- Update legal documents status with 60 days logic
  UPDATE legal_documents SET 
    status = CASE 
      WHEN validity_date IS NULL THEN 'valid'::document_status
      WHEN validity_date <= current_date THEN 'expired'::document_status
      WHEN validity_date <= sixty_days_future THEN 'expiring'::document_status
      ELSE 'valid'::document_status
    END,
    updated_at = NOW()
  WHERE status != CASE 
    WHEN validity_date IS NULL THEN 'valid'::document_status
    WHEN validity_date <= current_date THEN 'expired'::document_status
    WHEN validity_date <= sixty_days_future THEN 'expiring'::document_status
    ELSE 'valid'::document_status
  END;
END;
$function$;

-- Execute the status update function to recalculate all existing records
SELECT update_document_status();