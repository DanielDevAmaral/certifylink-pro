-- FASE 2: Proteção de Audit Logs - Políticas Explícitas de Negação
-- Garantir imutabilidade dos logs de auditoria

-- Remover a política de INSERT existente se houver
DROP POLICY IF EXISTS "audit_logs_allow_function_insert" ON public.audit_logs;

-- Criar políticas explícitas de negação

-- 1. Negar INSERT direto (apenas via função log_audit_event)
CREATE POLICY "audit_logs_deny_insert_direct"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 2. Negar todos os UPDATEs (logs são imutáveis)
CREATE POLICY "audit_logs_deny_update"
  ON public.audit_logs
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- 3. Negar todos os DELETEs de usuários comuns
CREATE POLICY "audit_logs_deny_delete_users"
  ON public.audit_logs
  FOR DELETE
  TO authenticated
  USING (false);

-- 4. Permitir DELETE apenas para admins via função específica
CREATE POLICY "audit_logs_admin_cleanup"
  ON public.audit_logs
  FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Adicionar comentário documentando imutabilidade
COMMENT ON TABLE public.audit_logs IS 
  'Tabela de logs de auditoria - IMUTÁVEL. Logs só podem ser inseridos via função log_audit_event() e deletados por admins via cleanup_old_audit_logs()';

-- Criar função de limpeza para admins
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Apenas admins podem executar
  IF get_user_role(auth.uid()) != 'admin'::user_role THEN
    RAISE EXCEPTION 'Only administrators can cleanup audit logs';
  END IF;

  -- Validar parâmetro
  IF days_to_keep < 30 THEN
    RAISE EXCEPTION 'Cannot delete logs newer than 30 days';
  END IF;

  -- Deletar logs antigos
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Registrar a limpeza
  PERFORM log_audit_event(
    'audit_logs',
    NULL,
    'CLEANUP',
    jsonb_build_object('days_to_keep', days_to_keep),
    jsonb_build_object('deleted_count', deleted_count)
  );

  RETURN deleted_count;
END;
$$;

-- Melhorar a função log_audit_event para capturar mais contexto
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_table_name text, 
  p_record_id uuid, 
  p_action text, 
  p_old_values jsonb DEFAULT NULL::jsonb, 
  p_new_values jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id uuid;
  user_agent text;
  ip_address text;
  current_user_id uuid;
  session_id text;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();

  -- Get user agent from request headers if available
  BEGIN
    user_agent := current_setting('request.headers', true)::json->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    user_agent := NULL;
  END;
  
  -- Get IP address from request headers if available  
  BEGIN
    ip_address := current_setting('request.headers', true)::json->>'x-forwarded-for';
  EXCEPTION WHEN OTHERS THEN
    ip_address := NULL;
  END;

  -- Get session ID if available
  BEGIN
    session_id := current_setting('request.jwt.claims', true)::json->>'session_id';
  EXCEPTION WHEN OTHERS THEN
    session_id := NULL;
  END;

  -- Inserir log com privilégios elevados (security definer bypass RLS)
  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    user_agent,
    ip_address
  ) VALUES (
    current_user_id,
    p_table_name,
    p_record_id,
    p_action,
    CASE 
      WHEN p_old_values IS NOT NULL THEN 
        p_old_values || jsonb_build_object('_session_id', session_id)
      ELSE 
        jsonb_build_object('_session_id', session_id)
    END,
    p_new_values,
    user_agent,
    ip_address::inet
  )
  RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$;