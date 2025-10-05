-- ============================================
-- Fix: Add Explicit Authentication to Audit Logs RLS Policies
-- ============================================
-- This migration adds explicit auth.uid() IS NOT NULL checks to all RLS policies
-- on the audit_logs table to ensure operational security data is strictly protected.

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_cleanup" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_deny_delete_users" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_deny_insert_direct" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_deny_update" ON public.audit_logs;

-- Recreate policies with explicit authentication checks

-- SELECT: Only authenticated admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role(auth.uid()) = 'admin'::user_role
  );

-- DELETE: Only authenticated admins can cleanup old logs
CREATE POLICY "Admins can cleanup audit logs"
  ON public.audit_logs
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role(auth.uid()) = 'admin'::user_role
  );

-- INSERT: Block all direct inserts (must use log_audit_event function)
CREATE POLICY "Block direct inserts to audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (false);

-- UPDATE: Block all updates to audit logs (immutable records)
CREATE POLICY "Block all updates to audit logs"
  ON public.audit_logs
  FOR UPDATE
  USING (false)
  WITH CHECK (false);