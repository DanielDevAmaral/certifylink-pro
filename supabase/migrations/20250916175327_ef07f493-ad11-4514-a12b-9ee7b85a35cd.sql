-- Create notifications management system for admins
-- This will allow admins to create and manage system notifications

-- Create notification management policies for admins
CREATE POLICY "Admins can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Admins can update notifications" 
ON public.notifications 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Admins can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Create function to send notifications to users
CREATE OR REPLACE FUNCTION public.create_system_notification(
  target_user_id uuid,
  notification_title text,
  notification_message text,
  notification_type text DEFAULT 'info',
  related_doc_id uuid DEFAULT NULL,
  related_doc_type document_category DEFAULT NULL,
  expires_hours integer DEFAULT 24
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- Only admins can create system notifications
  IF get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can create system notifications';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    notification_type,
    related_document_id,
    related_document_type,
    expires_at
  ) VALUES (
    target_user_id,
    notification_title,
    notification_message,
    notification_type,
    related_doc_id,
    related_doc_type,
    NOW() + (expires_hours || ' hours')::interval
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications 
  SET read_at = NOW() 
  WHERE id = notification_id 
    AND user_id = auth.uid()
    AND read_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(user_uuid uuid DEFAULT auth.uid())
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.notifications
    WHERE user_id = user_uuid
      AND read_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;