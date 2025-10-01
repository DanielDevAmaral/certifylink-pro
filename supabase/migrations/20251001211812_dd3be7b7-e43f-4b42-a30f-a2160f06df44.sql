-- Create function to delete terminated users and their certifications/badges
-- Preserves technical attestations and legal documents
CREATE OR REPLACE FUNCTION public.delete_terminated_user(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_status text;
  deleted_certs integer := 0;
  deleted_badges integer := 0;
  result jsonb;
BEGIN
  -- Only admins can delete users
  IF get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;

  -- Check if user is terminated
  SELECT status INTO user_status
  FROM public.profiles
  WHERE user_id = target_user_id;

  IF user_status IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF user_status != 'terminated' THEN
    RAISE EXCEPTION 'Only terminated users can be permanently deleted';
  END IF;

  -- Delete certifications
  DELETE FROM public.certifications 
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_certs = ROW_COUNT;

  -- Delete badges
  DELETE FROM public.badges 
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_badges = ROW_COUNT;

  -- Remove user from teams
  DELETE FROM public.team_members 
  WHERE user_id = target_user_id;

  -- Log the deletion
  PERFORM log_audit_event(
    'user_permanent_deletion',
    target_user_id,
    'DELETE_USER',
    jsonb_build_object(
      'status', user_status,
      'deleted_certifications', deleted_certs,
      'deleted_badges', deleted_badges
    ),
    jsonb_build_object('deleted_by', auth.uid())
  );

  -- Delete user roles
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id;

  -- Delete profile
  DELETE FROM public.profiles 
  WHERE user_id = target_user_id;

  result := jsonb_build_object(
    'success', true,
    'deleted_certifications', deleted_certs,
    'deleted_badges', deleted_badges,
    'message', 'User permanently deleted'
  );

  RETURN result;
END;
$$;