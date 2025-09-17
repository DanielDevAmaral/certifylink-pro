-- Add 'terminated' status to existing status types
ALTER TYPE user_status ADD VALUE 'terminated';

-- Update profiles table to handle terminated status
COMMENT ON COLUMN profiles.status IS 'User status: active, inactive, suspended, terminated';

-- Create function to get user status history
CREATE OR REPLACE FUNCTION public.get_user_status_history(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  old_status text,
  new_status text,
  reason text,
  changed_by uuid,
  changed_by_name text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only admins and the user themselves can view status history
  IF get_user_role(auth.uid()) != 'admin' AND auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    ush.id,
    ush.old_status,
    ush.new_status,
    ush.reason,
    ush.changed_by,
    COALESCE(p.full_name, 'Sistema') as changed_by_name,
    ush.created_at
  FROM user_status_history ush
  LEFT JOIN profiles p ON p.user_id = ush.changed_by
  WHERE ush.user_id = target_user_id
  ORDER BY ush.created_at DESC;
END;
$function$;

-- Create RLS policy for terminated users (they can still view their own data but cannot modify)
CREATE POLICY "Terminated users can view own data" 
ON profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update existing policies to handle terminated status appropriately
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = user_id AND status != 'terminated');

-- Update the update_user_status function to handle termination
CREATE OR REPLACE FUNCTION public.update_user_status(target_user_id uuid, new_status text, reason text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only admins can change user status
  IF get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can change user status';
  END IF;

  -- Validate status
  IF new_status NOT IN ('active', 'inactive', 'suspended', 'terminated') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  -- Require reason for deactivation, suspension, or termination
  IF new_status IN ('inactive', 'suspended', 'terminated') AND (reason IS NULL OR reason = '') THEN
    RAISE EXCEPTION 'Reason is required for status change to %', new_status;
  END IF;

  -- Update user status
  UPDATE public.profiles 
  SET 
    status = new_status,
    deactivated_at = CASE 
      WHEN new_status IN ('inactive', 'suspended', 'terminated') THEN NOW()
      ELSE NULL
    END,
    deactivated_by = CASE 
      WHEN new_status IN ('inactive', 'suspended', 'terminated') THEN auth.uid()
      ELSE NULL
    END,
    deactivation_reason = CASE 
      WHEN new_status IN ('inactive', 'suspended', 'terminated') THEN reason
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE user_id = target_user_id;

  RETURN FOUND;
END;
$function$;