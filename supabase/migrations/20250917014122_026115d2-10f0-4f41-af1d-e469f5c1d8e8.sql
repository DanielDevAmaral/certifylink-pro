-- Add user status management fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deactivated_by UUID REFERENCES auth.users(id),
ADD COLUMN deactivation_reason TEXT;

-- Create user status history table for audit trail
CREATE TABLE public.user_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_status_history table
ALTER TABLE public.user_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user_status_history
CREATE POLICY "Admins can view all status history" 
ON public.user_status_history 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Leaders can view team status history" 
ON public.user_status_history 
FOR SELECT 
USING (is_team_leader(auth.uid(), user_id));

CREATE POLICY "Users can view own status history" 
ON public.user_status_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert status history" 
ON public.user_status_history 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

-- Create function to automatically log status changes
CREATE OR REPLACE FUNCTION public.log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.user_status_history (
      user_id, 
      old_status, 
      new_status, 
      changed_by, 
      reason
    ) VALUES (
      NEW.user_id,
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE 
        WHEN NEW.status = 'inactive' OR NEW.status = 'suspended' THEN NEW.deactivation_reason
        ELSE NULL
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic status change logging
CREATE TRIGGER trigger_log_user_status_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_status_change();

-- Create function for user management operations
CREATE OR REPLACE FUNCTION public.update_user_status(
  target_user_id UUID,
  new_status TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only admins can change user status
  IF get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can change user status';
  END IF;

  -- Validate status
  IF new_status NOT IN ('active', 'inactive', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  -- Update user status
  UPDATE public.profiles 
  SET 
    status = new_status,
    deactivated_at = CASE 
      WHEN new_status IN ('inactive', 'suspended') THEN NOW()
      ELSE NULL
    END,
    deactivated_by = CASE 
      WHEN new_status IN ('inactive', 'suspended') THEN auth.uid()
      ELSE NULL
    END,
    deactivation_reason = CASE 
      WHEN new_status IN ('inactive', 'suspended') THEN reason
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE user_id = target_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_user_status(UUID, TEXT, TEXT) TO authenticated;