-- ================================
-- FASE 2: Performance Optimization
-- ================================

-- 1. Add retention days setting for notifications
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'notifications.retention_days',
  '90',
  'Número de dias para manter notificações lidas no sistema'
) ON CONFLICT (setting_key) DO NOTHING;

-- 2. Create performance indexes for notifications
-- Index for cleanup queries (expired notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at 
ON notifications(expires_at) 
WHERE expires_at IS NOT NULL;

-- Index for cleanup queries (old read notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_read_at 
ON notifications(read_at) 
WHERE read_at IS NOT NULL;

-- Index for user notifications lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, read_at, created_at DESC) 
WHERE read_at IS NULL;

-- 3. Create performance indexes for certifications (advanced filters)
-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_certifications_user_status_validity 
ON certifications(user_id, status, validity_date);

-- Index for function-based searches
CREATE INDEX IF NOT EXISTS idx_certifications_function 
ON certifications(function) 
WHERE status != 'deactivated';

-- Text search index for certification names
CREATE INDEX IF NOT EXISTS idx_certifications_name_search 
ON certifications USING gin(to_tsvector('portuguese', name));

-- 4. Create performance indexes for technical attestations
CREATE INDEX IF NOT EXISTS idx_technical_attestations_user_status 
ON technical_attestations(user_id, status, validity_date);

-- Text search for client names
CREATE INDEX IF NOT EXISTS idx_technical_attestations_client_search 
ON technical_attestations USING gin(to_tsvector('portuguese', client_name));

-- 5. Create performance indexes for legal documents
CREATE INDEX IF NOT EXISTS idx_legal_documents_user_status_type 
ON legal_documents(user_id, status, document_type, validity_date);

-- 6. Create performance indexes for badges
CREATE INDEX IF NOT EXISTS idx_badges_user_status_expiry 
ON badges(user_id, status, expiry_date);

-- Text search for badge names and categories
CREATE INDEX IF NOT EXISTS idx_badges_name_search 
ON badges USING gin(to_tsvector('portuguese', name));

CREATE INDEX IF NOT EXISTS idx_badges_category 
ON badges(category) 
WHERE status != 'deactivated';

-- 7. Optimize profiles table for team queries
CREATE INDEX IF NOT EXISTS idx_profiles_status 
ON profiles(status) 
WHERE status = 'active';

-- 8. Create notification monitoring function
CREATE OR REPLACE FUNCTION get_notification_metrics(
  period_hours integer DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  period_start timestamp with time zone;
BEGIN
  period_start := NOW() - (period_hours || ' hours')::interval;
  
  SELECT jsonb_build_object(
    'total_created', COUNT(*),
    'total_read', COUNT(*) FILTER (WHERE read_at IS NOT NULL),
    'total_unread', COUNT(*) FILTER (WHERE read_at IS NULL),
    'total_expired', COUNT(*) FILTER (WHERE expires_at < NOW()),
    'by_type', jsonb_object_agg(
      notification_type,
      COUNT(*)
    ),
    'read_rate_percentage', 
      ROUND(
        (COUNT(*) FILTER (WHERE read_at IS NOT NULL)::numeric / 
         NULLIF(COUNT(*)::numeric, 0) * 100), 
        2
      ),
    'period_hours', period_hours,
    'generated_at', NOW()
  ) INTO result
  FROM notifications
  WHERE created_at >= period_start;
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_notification_metrics IS 'Retorna métricas do sistema de notificações para monitoramento';
