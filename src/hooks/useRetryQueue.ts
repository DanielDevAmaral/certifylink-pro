import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RetryQueueStats {
  total_pending: number;
  total_failed: number;
  avg_retry_count: number;
  oldest_pending: string | null;
  by_retry_count: Record<number, number>;
}

export const useRetryQueueStats = () => {
  return useQuery({
    queryKey: ['retry-queue-stats'],
    queryFn: async (): Promise<RetryQueueStats> => {
      console.log('📊 Fetching retry queue stats...');
      
      const { data, error } = await supabase.rpc('get_retry_queue_stats');

      if (error) {
        console.error('❌ Error fetching retry queue stats:', error);
        throw error;
      }

      console.log('✅ Retry queue stats fetched:', data);
      return data as unknown as RetryQueueStats;
    },
    refetchInterval: 60 * 1000, // Refetch every minute
    staleTime: 30 * 1000, // Consider stale after 30 seconds
  });
};

export const useProcessRetryQueue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('🔄 Processing retry queue...');
      
      const { data, error } = await supabase.functions.invoke('notification-retry-system', {
        method: 'POST',
      });

      if (error) {
        console.error('❌ Error processing retry queue:', error);
        throw error;
      }

      console.log('✅ Retry queue processed:', data);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Retry queue processado: ${data.result.succeeded} sucesso, ${data.result.failed} falhas`);
      queryClient.invalidateQueries({ queryKey: ['retry-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['notification-metrics'] });
    },
    onError: (error: Error) => {
      console.error('❌ Retry queue processing failed:', error);
      toast.error('Erro ao processar retry queue');
    },
  });
};
