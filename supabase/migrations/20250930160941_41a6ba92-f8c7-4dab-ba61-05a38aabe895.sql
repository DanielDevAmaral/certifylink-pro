-- =====================================================
-- CORREÇÕES ADICIONAIS DE SEGURANÇA
-- =====================================================

-- =====================================================
-- 1. ADICIONAR SEARCH_PATH ÀS FUNÇÕES RESTANTES
-- =====================================================

-- Atualizar função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Atualizar função handle_user_deactivation
CREATE OR REPLACE FUNCTION public.handle_user_deactivation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  docs_updated integer := 0;
  total_docs integer := 0;
BEGIN
  IF NEW.status IN ('inactive', 'suspended', 'terminated') AND OLD.status = 'active' THEN
    SELECT COUNT(*) INTO total_docs
    FROM (
      SELECT id FROM certifications WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status
      UNION ALL
      SELECT id FROM badges WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status
      UNION ALL  
      SELECT id FROM technical_attestations WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status
      UNION ALL
      SELECT id FROM legal_documents WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status
    ) as all_docs;

    UPDATE certifications 
    SET status = 'deactivated'::document_status, updated_at = NOW()
    WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status;
    
    GET DIAGNOSTICS docs_updated = ROW_COUNT;
    
    UPDATE badges 
    SET status = 'deactivated'::document_status, updated_at = NOW()
    WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status;
    
    UPDATE technical_attestations 
    SET status = 'deactivated'::document_status, updated_at = NOW()
    WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status;
    
    UPDATE legal_documents 
    SET status = 'deactivated'::document_status, updated_at = NOW()
    WHERE user_id = NEW.user_id AND status != 'deactivated'::document_status;
    
    PERFORM log_audit_event(
      'user_documents',
      NEW.user_id,
      'DEACTIVATE_USER_DOCUMENTS',
      jsonb_build_object('old_status', OLD.status, 'total_docs_found', total_docs),
      jsonb_build_object('new_status', NEW.status, 'reason', NEW.deactivation_reason, 'docs_processed', total_docs)
    );
    
  ELSIF NEW.status = 'active' AND OLD.status IN ('inactive', 'suspended', 'terminated') THEN
    UPDATE certifications SET 
      status = CASE 
        WHEN validity_date IS NULL THEN 'valid'::document_status
        WHEN validity_date <= CURRENT_DATE THEN 'expired'::document_status
        WHEN validity_date <= (CURRENT_DATE + (get_alert_days('certification') || ' days')::interval) THEN 'expiring'::document_status
        ELSE 'valid'::document_status
      END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND status = 'deactivated'::document_status;
    
    UPDATE badges SET 
      status = CASE 
        WHEN expiry_date IS NULL THEN 'valid'::document_status
        WHEN expiry_date <= CURRENT_DATE THEN 'expired'::document_status
        WHEN expiry_date <= (CURRENT_DATE + (get_alert_days('badge') || ' days')::interval) THEN 'expiring'::document_status
        ELSE 'valid'::document_status
      END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND status = 'deactivated'::document_status;
    
    UPDATE technical_attestations SET 
      status = CASE 
        WHEN validity_date IS NULL THEN 'valid'::document_status
        WHEN validity_date <= CURRENT_DATE THEN 'expired'::document_status
        WHEN validity_date <= (CURRENT_DATE + (get_alert_days('technical_attestation') || ' days')::interval) THEN 'expiring'::document_status
        ELSE 'valid'::document_status
      END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND status = 'deactivated'::document_status;
    
    UPDATE legal_documents SET 
      status = CASE 
        WHEN validity_date IS NULL THEN 'valid'::document_status
        WHEN validity_date <= CURRENT_DATE THEN 'expired'::document_status
        WHEN validity_date <= (CURRENT_DATE + (get_alert_days('legal_document') || ' days')::interval) THEN 'expiring'::document_status
        ELSE 'valid'::document_status
      END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND status = 'deactivated'::document_status;
    
    PERFORM log_audit_event(
      'user_documents',
      NEW.user_id,
      'REACTIVATE_USER_DOCUMENTS',
      jsonb_build_object('old_status', OLD.status),
      jsonb_build_object('new_status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Atualizar função log_user_status_change
CREATE OR REPLACE FUNCTION public.log_user_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
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
$function$;

-- =====================================================
-- 2. MOVER EXTENSÕES DO SCHEMA PUBLIC
-- =====================================================

-- Nota: Algumas extensões podem precisar permanecer no schema public
-- por questões de compatibilidade. Vamos mover apenas as que são seguras.

-- Criar schema dedicado para extensões se não existir
CREATE SCHEMA IF NOT EXISTS extensions;

-- Verificar e mover extensões que não são críticas
-- uuid-ossp pode permanecer no public (usado amplamente)
-- pg_stat_statements deve estar no extensions schema
DO $$
BEGIN
  -- Mover pg_stat_statements se existir
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_stat_statements' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION pg_stat_statements SET SCHEMA extensions;
  END IF;
END $$;

-- Garantir que futuras extensões sejam criadas no schema correto
-- (isso é mais uma recomendação para instalações futuras)

-- =====================================================
-- 3. ADICIONAR COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.is_direct_team_leader(uuid, uuid) IS 
'Verifica se um usuário é líder direto de outro usuário através de team_members. Usa SECURITY DEFINER para evitar recursão RLS.';

COMMENT ON FUNCTION public.get_user_role(uuid) IS 
'Retorna o role de um usuário. Usa SECURITY DEFINER para evitar recursão RLS.';

COMMENT ON TABLE public.security_audit_log IS 
'Log de auditoria de segurança para rastreamento de ações críticas no sistema.';

-- =====================================================
-- CONCLUSÃO
-- =====================================================
-- Funções restantes agora têm search_path definido.
-- Extensões movidas para schema dedicado quando possível.
-- Sistema mais seguro e documentado.