-- =====================================================
-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA
-- =====================================================

-- =====================================================
-- 1. CORRIGIR POLÍTICAS RLS DA TABELA PROFILES
-- =====================================================

-- Remover políticas existentes muito permissivas
DROP POLICY IF EXISTS "Leaders can view team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leaders can update team profiles" ON public.profiles;

-- Criar função segura para verificar se é líder de equipe do usuário
CREATE OR REPLACE FUNCTION public.is_direct_team_leader(leader_id uuid, member_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.team_members tm
    INNER JOIN public.teams t ON t.id = tm.team_id
    WHERE t.leader_id = leader_id 
      AND tm.user_id = member_id
  );
$$;

-- Recriar políticas restritivas para líderes
CREATE POLICY "Leaders can view direct team members profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_direct_team_leader(auth.uid(), user_id)
);

CREATE POLICY "Leaders can update direct team members profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.is_direct_team_leader(auth.uid(), user_id)
)
WITH CHECK (
  public.is_direct_team_leader(auth.uid(), user_id)
);

-- =====================================================
-- 2. CORRIGIR POLÍTICAS RLS DE TECHNICAL_ATTESTATIONS
-- =====================================================

-- Remover política muito permissiva
DROP POLICY IF EXISTS "All authenticated users can view attestations" ON public.technical_attestations;

-- Criar política restritiva: apenas próprio usuário, líderes diretos e admins
CREATE POLICY "Users can view own or team attestations"
ON public.technical_attestations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  public.get_user_role(auth.uid()) = 'admin'::user_role OR
  public.is_direct_team_leader(auth.uid(), user_id)
);

-- Garantir que apenas admins e líderes podem atualizar
DROP POLICY IF EXISTS "Admins can update all technical attestations" ON public.technical_attestations;

CREATE POLICY "Admins and leaders can update attestations"
ON public.technical_attestations
FOR UPDATE
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'admin'::user_role OR
  public.is_direct_team_leader(auth.uid(), user_id)
)
WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin'::user_role OR
  public.is_direct_team_leader(auth.uid(), user_id)
);

-- =====================================================
-- 3. CORRIGIR POLÍTICAS RLS DE LEGAL_DOCUMENTS
-- =====================================================

-- Remover políticas muito permissivas
DROP POLICY IF EXISTS "All authenticated users can view non-sensitive documents" ON public.legal_documents;

-- Criar política restritiva para documentos não sensíveis
CREATE POLICY "Users can view own or team non-sensitive documents"
ON public.legal_documents
FOR SELECT
TO authenticated
USING (
  NOT is_sensitive AND (
    auth.uid() = user_id OR
    public.get_user_role(auth.uid()) = 'admin'::user_role OR
    public.is_direct_team_leader(auth.uid(), user_id)
  )
);

-- Política para documentos sensíveis permanece apenas para o dono e admins
-- (já existe, mas vamos recriar para garantir)
DROP POLICY IF EXISTS "Users can view own sensitive documents" ON public.legal_documents;

CREATE POLICY "Users can view own sensitive documents"
ON public.legal_documents
FOR SELECT
TO authenticated
USING (
  is_sensitive AND (
    auth.uid() = user_id OR
    public.get_user_role(auth.uid()) = 'admin'::user_role
  )
);

-- =====================================================
-- 4. CORRIGIR POLÍTICAS RLS DE CERTIFICATIONS
-- =====================================================

-- Remover política muito permissiva
DROP POLICY IF EXISTS "All authenticated users can view certifications" ON public.certifications;

-- Criar política restritiva: apenas próprio usuário, líderes diretos e admins
CREATE POLICY "Users can view own or team certifications"
ON public.certifications
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  public.get_user_role(auth.uid()) = 'admin'::user_role OR
  public.is_direct_team_leader(auth.uid(), user_id)
);

-- =====================================================
-- 5. CORRIGIR POLÍTICAS RLS DE BADGES
-- =====================================================

-- Remover política muito permissiva
DROP POLICY IF EXISTS "All authenticated users can view badges" ON public.badges;

-- Criar política restritiva
CREATE POLICY "Users can view own or team badges"
ON public.badges
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  public.get_user_role(auth.uid()) = 'admin'::user_role OR
  public.is_direct_team_leader(auth.uid(), user_id)
);

-- =====================================================
-- 6. ADICIONAR SEARCH_PATH ÀS FUNÇÕES SEM PROTEÇÃO
-- =====================================================

-- Atualizar função create_system_notification
CREATE OR REPLACE FUNCTION public.create_system_notification(
  target_user_id uuid, 
  notification_title text, 
  notification_message text, 
  notification_type text DEFAULT 'info'::text, 
  related_doc_id uuid DEFAULT NULL::uuid, 
  related_doc_type document_category DEFAULT NULL::document_category, 
  expires_hours integer DEFAULT 24
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  notification_id uuid;
BEGIN
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
$function$;

-- Atualizar função mark_notification_read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.notifications 
  SET read_at = NOW() 
  WHERE id = notification_id 
    AND user_id = auth.uid()
    AND read_at IS NULL;
  
  RETURN FOUND;
END;
$function$;

-- Atualizar função update_user_status
CREATE OR REPLACE FUNCTION public.update_user_status(
  target_user_id uuid, 
  new_status text, 
  reason text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can change user status';
  END IF;

  IF new_status NOT IN ('active', 'inactive', 'suspended', 'terminated') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  IF new_status IN ('inactive', 'suspended', 'terminated') AND (reason IS NULL OR reason = '') THEN
    RAISE EXCEPTION 'Reason is required for status change to %', new_status;
  END IF;

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

-- =====================================================
-- 7. ADICIONAR ÍNDICES PARA MELHORAR PERFORMANCE
-- =====================================================

-- Índices para otimizar queries de team membership
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON public.teams(leader_id);

-- Índices para otimizar queries de documentos por user_id
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON public.certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON public.badges(user_id);
CREATE INDEX IF NOT EXISTS idx_technical_attestations_user_id ON public.technical_attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_user_id ON public.legal_documents(user_id);

-- Índices para otimizar queries de status
CREATE INDEX IF NOT EXISTS idx_certifications_status ON public.certifications(status);
CREATE INDEX IF NOT EXISTS idx_badges_status ON public.badges(status);
CREATE INDEX IF NOT EXISTS idx_technical_attestations_status ON public.technical_attestations(status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON public.legal_documents(status);

-- Índice para otimizar queries de notificações não lidas
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read_at);

-- =====================================================
-- 8. CRIAR TABELA DE AUDITORIA DE SEGURANÇA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de auditoria de segurança
CREATE POLICY "Only admins can view security audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin'::user_role);

-- Índice para queries por usuário e data
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_created 
ON public.security_audit_log(user_id, created_at DESC);

-- Índice para queries por tipo de ação
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action_type 
ON public.security_audit_log(action_type, created_at DESC);

-- =====================================================
-- CONCLUSÃO
-- =====================================================
-- Todas as políticas RLS foram atualizadas com verificações
-- restritivas baseadas em relações reais de equipe.
-- Funções agora têm search_path definido.
-- Índices adicionados para melhorar performance.
-- Sistema de auditoria de segurança implementado.