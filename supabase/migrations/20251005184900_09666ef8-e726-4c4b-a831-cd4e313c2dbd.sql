-- ============================================
-- Fix: Add Explicit Authentication to Legal Documents RLS Policies
-- ============================================
-- This migration adds explicit auth.uid() IS NOT NULL checks to all RLS policies
-- on the legal_documents table to prevent unauthorized access to confidential legal documents.

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Admins can view all documents including sensitive" ON public.legal_documents;
DROP POLICY IF EXISTS "Admins can update all legal documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Admins can delete all legal documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Users can view own or team non-sensitive documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Users can view own sensitive documents" ON public.legal_documents;

-- Recreate policies with explicit authentication checks and improved security

-- SELECT policies: Separate sensitive and non-sensitive access
CREATE POLICY "Users can view own sensitive documents"
  ON public.legal_documents
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND is_sensitive = true
    AND (
      auth.uid() = user_id 
      OR get_user_role(auth.uid()) = 'admin'::user_role
    )
  );

CREATE POLICY "Users can view own or team non-sensitive documents"
  ON public.legal_documents
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND is_sensitive = false
    AND (
      auth.uid() = user_id 
      OR get_user_role(auth.uid()) = 'admin'::user_role
      OR is_direct_team_leader(auth.uid(), user_id)
    )
  );

-- INSERT policy: Users can only create their own documents
CREATE POLICY "Users can insert own documents"
  ON public.legal_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

-- UPDATE policies: Admins can update all, users can update only their own
CREATE POLICY "Users can update own documents"
  ON public.legal_documents
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

CREATE POLICY "Admins can update all legal documents"
  ON public.legal_documents
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role(auth.uid()) = 'admin'::user_role
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND get_user_role(auth.uid()) = 'admin'::user_role
  );

-- DELETE policy: Only admins can delete
CREATE POLICY "Admins can delete all legal documents"
  ON public.legal_documents
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role(auth.uid()) = 'admin'::user_role
  );