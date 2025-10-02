-- FASE 1: Segurança de Documentos Jurídicos - Database Layer
-- Adicionar controles para prevenir manipulação da flag is_sensitive

-- 1. Adicionar colunas de rastreamento de mudanças de sensibilidade
ALTER TABLE public.legal_documents 
ADD COLUMN IF NOT EXISTS last_sensitivity_change_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_sensitivity_change_at timestamp with time zone;

-- 2. Criar tabela de auditoria específica para mudanças de sensibilidade
CREATE TABLE IF NOT EXISTS public.legal_document_sensitivity_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  old_is_sensitive boolean NOT NULL,
  new_is_sensitive boolean NOT NULL,
  reason text,
  changed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ativar RLS na tabela de auditoria
ALTER TABLE public.legal_document_sensitivity_audit ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver o histórico de mudanças de sensibilidade
CREATE POLICY "Admins can view sensitivity audit"
  ON public.legal_document_sensitivity_audit
  FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- 3. Criar função de validação para mudanças na flag is_sensitive
CREATE OR REPLACE FUNCTION public.validate_sensitive_flag_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role user_role;
BEGIN
  -- Se is_sensitive não mudou, permitir
  IF OLD.is_sensitive = NEW.is_sensitive THEN
    RETURN NEW;
  END IF;

  -- Obter role do usuário atual
  current_user_role := get_user_role(auth.uid());

  -- Caso 1: Usuário comum tentando REMOVER flag de sensível (true → false)
  -- BLOQUEAR esta ação
  IF OLD.is_sensitive = true AND NEW.is_sensitive = false AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem remover a marcação de documento sensível';
  END IF;

  -- Caso 2: Usuário comum ADICIONANDO flag de sensível (false → true)
  -- PERMITIR esta ação
  IF OLD.is_sensitive = false AND NEW.is_sensitive = true THEN
    -- Registrar a mudança
    NEW.last_sensitivity_change_by := auth.uid();
    NEW.last_sensitivity_change_at := NOW();
    
    -- Inserir no histórico de auditoria
    INSERT INTO public.legal_document_sensitivity_audit 
      (document_id, changed_by, old_is_sensitive, new_is_sensitive, reason)
    VALUES 
      (NEW.id, auth.uid(), OLD.is_sensitive, NEW.is_sensitive, 
       'Usuário marcou documento como sensível');
    
    RETURN NEW;
  END IF;

  -- Caso 3: Admin fazendo qualquer mudança
  IF current_user_role = 'admin' THEN
    NEW.last_sensitivity_change_by := auth.uid();
    NEW.last_sensitivity_change_at := NOW();
    
    INSERT INTO public.legal_document_sensitivity_audit 
      (document_id, changed_by, old_is_sensitive, new_is_sensitive, reason)
    VALUES 
      (NEW.id, auth.uid(), OLD.is_sensitive, NEW.is_sensitive, 
       'Administrador alterou flag de sensibilidade');
    
    RETURN NEW;
  END IF;

  -- Caso padrão: bloquear
  RAISE EXCEPTION 'Mudança de sensibilidade não permitida';
END;
$$;

-- 4. Criar trigger para validar mudanças em is_sensitive
DROP TRIGGER IF EXISTS validate_legal_document_sensitivity ON public.legal_documents;
CREATE TRIGGER validate_legal_document_sensitivity
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  WHEN (OLD.is_sensitive IS DISTINCT FROM NEW.is_sensitive)
  EXECUTE FUNCTION public.validate_sensitive_flag_change();

-- 5. Adicionar índice para performance em queries filtradas por is_sensitive
CREATE INDEX IF NOT EXISTS idx_legal_documents_is_sensitive 
  ON public.legal_documents(is_sensitive);

-- 6. Criar índice composto para queries de documentos sensíveis por usuário
CREATE INDEX IF NOT EXISTS idx_legal_documents_user_sensitive 
  ON public.legal_documents(user_id, is_sensitive);

-- 7. Adicionar comentário documentando o comportamento
COMMENT ON COLUMN public.legal_documents.is_sensitive IS 
  'Flag de documento sensível. Usuários podem marcar como true, mas apenas admins podem remover (true→false). Todas as mudanças são auditadas.';

-- 8. Registrar a migração no audit log
DO $$
BEGIN
  PERFORM log_audit_event(
    'legal_documents',
    NULL,
    'SECURITY_MIGRATION',
    NULL,
    jsonb_build_object(
      'migration', 'legal_document_sensitivity_controls',
      'description', 'Added sensitivity flag validation and audit trail'
    )
  );
END $$;