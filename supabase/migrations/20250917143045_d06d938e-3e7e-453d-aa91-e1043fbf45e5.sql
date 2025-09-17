-- Remover políticas restritivas e criar novas mais abertas para visualização

-- Atualizar políticas para certificações
DROP POLICY IF EXISTS "Leaders can view team certifications" ON public.certifications;
DROP POLICY IF EXISTS "Admins can view all certifications" ON public.certifications;

-- Nova política: todos usuários autenticados podem ver todas as certificações
CREATE POLICY "All authenticated users can view certifications" 
ON public.certifications 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Atualizar políticas para atestados técnicos
DROP POLICY IF EXISTS "Leaders can view team attestations" ON public.technical_attestations;
DROP POLICY IF EXISTS "Admins can view all attestations" ON public.technical_attestations;

-- Nova política: todos usuários autenticados podem ver todos os atestados
CREATE POLICY "All authenticated users can view attestations" 
ON public.technical_attestations 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Atualizar políticas para documentos jurídicos
DROP POLICY IF EXISTS "Leaders can view team documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.legal_documents;

-- Nova política: todos usuários autenticados podem ver documentos não sensíveis
CREATE POLICY "All authenticated users can view non-sensitive documents" 
ON public.legal_documents 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND NOT is_sensitive);

-- Nova política: admins podem ver todos os documentos (incluindo sensíveis)
CREATE POLICY "Admins can view all documents including sensitive" 
ON public.legal_documents 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Nova política: usuários podem ver seus próprios documentos sensíveis
CREATE POLICY "Users can view own sensitive documents" 
ON public.legal_documents 
FOR SELECT 
USING (auth.uid() = user_id AND is_sensitive);