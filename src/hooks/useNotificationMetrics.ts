import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NotificationMetrics {
  total_created: number;
  total_read: number;
  total_unread: number;
  total_expired: number;
  by_type: Record<string, number>;
  read_rate_percentage: number;
  period_hours: number;
  generated_at: string;
}

export const useNotificationMetrics = (periodHours: number = 24) => {
  return useQuery({
    queryKey: ['notification-metrics', periodHours],
    queryFn: async (): Promise<NotificationMetrics> => {
      console.log(`📊 Fetching notification metrics for last ${periodHours} hours...`);
      
      const { data, error } = await supabase.rpc('get_notification_metrics', {
        period_hours: periodHours,
      });

      if (error) {
        console.error('❌ Error fetching notification metrics:', error);
        throw error;
      }

      console.log('✅ Notification metrics fetched:', data);
      return data as unknown as NotificationMetrics;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });
};

export const useCleanupNotifications = () => {
  return useQuery({
    queryKey: ['cleanup-notifications-status'],
    queryFn: async () => {
      console.log('🧹 Triggering notification cleanup...');
      
      const { data, error } = await supabase.functions.invoke('cleanup-notifications', {
        method: 'POST',
      });

      if (error) {
        console.error('❌ Error cleaning up notifications:', error);
        throw error;
      }

      console.log('✅ Cleanup completed:', data);
      return data;
    },
    enabled: false, // Only run when manually triggered
  });
};
