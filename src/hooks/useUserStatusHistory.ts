import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  reason: string | null;
  changed_by: string | null;
  changed_by_name: string;
  created_at: string;
}

export function useUserStatusHistory(userId: string) {
  return useQuery({
    queryKey: ['user-status-history', userId],
    queryFn: async (): Promise<StatusHistoryEntry[]> => {
      const { data, error } = await supabase.rpc('get_user_status_history', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error fetching user status history:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId,
  });
}