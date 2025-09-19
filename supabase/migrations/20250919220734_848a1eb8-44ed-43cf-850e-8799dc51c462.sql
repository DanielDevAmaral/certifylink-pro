-- Fix security warnings by properly setting search_path for functions
CREATE OR REPLACE FUNCTION public.update_status_on_validity_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_date date := CURRENT_DATE;
  thirty_days_future date := CURRENT_DATE + INTERVAL '30 days';
  new_status document_status;
BEGIN
  -- Calculate the new status based on validity_date
  IF NEW.validity_date IS NULL THEN
    new_status := 'valid'::document_status;
  ELSIF NEW.validity_date <= current_date THEN
    new_status := 'expired'::document_status;
  ELSIF NEW.validity_date <= thirty_days_future THEN
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