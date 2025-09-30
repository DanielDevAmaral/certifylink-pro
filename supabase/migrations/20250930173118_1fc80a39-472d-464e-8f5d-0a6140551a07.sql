-- Fix security warnings for new functions

-- Recreate get_notification_metrics with proper security settings
DROP FUNCTION IF EXISTS get_notification_metrics(INTEGER);

CREATE OR REPLACE FUNCTION get_notification_metrics(period_hours INTEGER DEFAULT 24)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recreate get_retry_queue_stats with proper security settings
DROP FUNCTION IF EXISTS get_retry_queue_stats();

CREATE OR REPLACE FUNCTION get_retry_queue_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;