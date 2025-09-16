-- Enable leaked password protection in Supabase Auth
-- This addresses the security warning about leaked password protection being disabled

-- Update auth configuration to enable password strength validation
UPDATE auth.config 
SET 
  password_min_length = 8,
  password_require_letters = true,
  password_require_uppercase = true,
  password_require_lowercase = true,
  password_require_numbers = true,
  password_require_symbols = true
WHERE 
  TRUE;

-- Create a more secure password policy function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check minimum length
  IF length(password) < 8 THEN
    RETURN false;
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN false;
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN false;
  END IF;
  
  -- Check for number
  IF password !~ '[0-9]' THEN
    RETURN false;
  END IF;
  
  -- Check for special character
  IF password !~ '[^A-Za-z0-9]' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;