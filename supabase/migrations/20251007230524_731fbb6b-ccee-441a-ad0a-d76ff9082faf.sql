-- FASE 1: Reestruturação do Sistema de Editais
-- =====================================================

-- 1. Criar tabela de editais (informações gerais)
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_name TEXT NOT NULL,
  bid_code TEXT NOT NULL UNIQUE,
  bid_description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Habilitar RLS na tabela bids
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para bids
CREATE POLICY "Admins can manage bids"
ON public.bids
FOR ALL
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Authenticated users can view bids"
ON public.bids
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4. Migrar dados existentes para a tabela bids
-- Agrupar requisitos por bid_code e criar um edital para cada grupo
INSERT INTO public.bids (bid_name, bid_code, bid_description, created_by)
SELECT DISTINCT 
  bid_name,
  bid_code,
  'Edital migrado automaticamente do sistema antigo',
  created_by
FROM public.bid_requirements
ON CONFLICT (bid_code) DO NOTHING;

-- 5. Adicionar coluna bid_id na tabela bid_requirements
ALTER TABLE public.bid_requirements 
ADD COLUMN IF NOT EXISTS bid_id UUID REFERENCES public.bids(id) ON DELETE CASCADE;

-- 6. Preencher bid_id nos requisitos existentes
UPDATE public.bid_requirements br
SET bid_id = b.id
FROM public.bids b
WHERE br.bid_code = b.bid_code
  AND br.bid_id IS NULL;

-- 7. Tornar bid_id obrigatório após migração
ALTER TABLE public.bid_requirements 
ALTER COLUMN bid_id SET NOT NULL;

-- 8. Remover colunas redundantes (agora estão em bids)
ALTER TABLE public.bid_requirements 
DROP COLUMN IF EXISTS bid_name,
DROP COLUMN IF EXISTS bid_code;

-- 9. Criar trigger para updated_at em bids
CREATE TRIGGER update_bids_updated_at
BEFORE UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_bid_requirements_bid_id 
ON public.bid_requirements(bid_id);

CREATE INDEX IF NOT EXISTS idx_bids_code 
ON public.bids(bid_code);

-- 11. Atualizar políticas RLS de bid_requirements para usar bid_id
DROP POLICY IF EXISTS "Admins can manage requirements" ON public.bid_requirements;
DROP POLICY IF EXISTS "Authenticated users can view requirements" ON public.bid_requirements;

CREATE POLICY "Admins can manage requirements"
ON public.bid_requirements
FOR ALL
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Authenticated users can view requirements"
ON public.bid_requirements
FOR SELECT
USING (auth.uid() IS NOT NULL);