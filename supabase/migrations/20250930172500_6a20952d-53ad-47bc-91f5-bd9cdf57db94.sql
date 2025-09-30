-- Phase 2 Optimization: Performance Indexes and Retry System (Fixed)

-- ==========================================
-- PART 1: PERFORMANCE INDEXES
-- ==========================================

-- Notifications table indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, read_at) 
WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_expires_at 
ON notifications(expires_at) 
WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_type_created 
ON notifications(notification_type, created_at DESC);

-- Certifications table indexes
CREATE INDEX IF NOT EXISTS idx_certifications_user_status_validity 
ON certifications(user_id, status, validity_date DESC);

CREATE INDEX IF NOT EXISTS idx_certifications_function_status 
ON certifications(function, status) 
WHERE status = 'valid';

CREATE INDEX IF NOT EXISTS idx_certifications_validity_expiring 
ON certifications(validity_date) 
WHERE validity_date IS NOT NULL AND status = 'valid';

-- GIN index for text search on certifications
CREATE INDEX IF NOT EXISTS idx_certifications_name_gin 
ON certifications USING gin(to_tsvector('portuguese', name));

-- Legal documents indexes
CREATE INDEX IF NOT EXISTS idx_legal_docs_user_status_validity 
ON legal_documents(user_id, status, validity_date DESC);

CREATE INDEX IF NOT EXISTS idx_legal_docs_type_status 
ON legal_documents(document_type, status);

CREATE INDEX IF NOT EXISTS idx_legal_docs_validity_expiring 
ON legal_documents(validity_date) 
WHERE validity_date IS NOT NULL AND status = 'valid';

-- Technical attestations indexes
CREATE INDEX IF NOT EXISTS idx_tech_attest_user_status_validity 
ON technical_attestations(user_id, status, validity_date DESC);

-- Badges indexes
CREATE INDEX IF NOT EXISTS idx_badges_user_status_expiry 
ON badges(user_id, status, expiry_date DESC);

-- Profiles indexes for search
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_gin 
ON profiles USING gin(to_tsvector('portuguese', full_name));

CREATE INDEX IF NOT EXISTS idx_profiles_status 
ON profiles(status) 
WHERE status = 'active';

-- ==========================================
-- PART 2: NOTIFICATION RETRY SYSTEM
-- ==========================================

-- Create notification_retry_queue table
CREATE TABLE IF NOT EXISTS notification_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL,
  user_id UUID NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  last_error TEXT,
  next_retry_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_data JSONB NOT NULL
);

-- Index for processing retry queue
CREATE INDEX IF NOT EXISTS idx_retry_queue_next_retry 
ON notification_retry_queue(next_retry_at) 
WHERE retry_count < max_retries;

-- RLS policies for retry queue (admin only)
ALTER TABLE notification_retry_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage retry queue"
ON notification_retry_queue
FOR ALL
USING (get_user_role(auth.uid()) = 'admin');

-- ==========================================
-- PART 3: NOTIFICATION RETENTION POLICIES
-- ==========================================

-- Add retention policy settings if not exists
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('notifications.retention_by_type', 
   '{"info": 30, "warning": 60, "error": 90, "success": 14}', 
   'Retention days by notification type')
ON CONFLICT (setting_key) DO NOTHING;

-- ==========================================
-- PART 4: MONITORING FUNCTIONS (Fixed)
-- ==========================================

-- Drop and recreate the function with correct return type
DROP FUNCTION IF EXISTS get_notification_metrics(INTEGER);

CREATE OR REPLACE FUNCTION get_notification_metrics(period_hours INTEGER DEFAULT 24)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  period_start TIMESTAMP WITH TIME ZONE;
BEGIN
  period_start := now() - (period_hours || ' hours')::INTERVAL;
  
  SELECT jsonb_build_object(
    'total_created', (SELECT COUNT(*) FROM notifications WHERE created_at >= period_start),
    'total_read', (SELECT COUNT(*) FROM notifications WHERE read_at >= period_start),
    'total_unread', (SELECT COUNT(*) FROM notifications WHERE created_at >= period_start AND read_at IS NULL),
    'total_expired', (SELECT COUNT(*) FROM notifications WHERE expires_at < now() AND expires_at >= period_start),
    'by_type', (
      SELECT jsonb_object_agg(notification_type, count)
      FROM (
        SELECT notification_type, COUNT(*) as count
        FROM notifications
        WHERE created_at >= period_start
        GROUP BY notification_type
      ) sub
    ),
    'read_rate_percentage', (
      CASE 
        WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE read_at IS NOT NULL)::NUMERIC / COUNT(*)) * 100, 2)
        ELSE 0
      END
    )::NUMERIC,
    'period_hours', period_hours,
    'generated_at', now()
  ) INTO result
  FROM notifications
  WHERE created_at >= period_start;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get retry queue stats
CREATE OR REPLACE FUNCTION get_retry_queue_stats()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'total_pending', COUNT(*) FILTER (WHERE retry_count < max_retries),
      'total_failed', COUNT(*) FILTER (WHERE retry_count >= max_retries),
      'avg_retry_count', ROUND(AVG(retry_count), 2),
      'oldest_pending', MIN(created_at) FILTER (WHERE retry_count < max_retries),
      'by_retry_count', (
        SELECT jsonb_object_agg(retry_count, count)
        FROM (
          SELECT retry_count, COUNT(*) as count
          FROM notification_retry_queue
          WHERE retry_count < max_retries
          GROUP BY retry_count
        ) sub
      )
    )
    FROM notification_retry_queue
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;