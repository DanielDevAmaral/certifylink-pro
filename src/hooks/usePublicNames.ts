import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePublicNames(userIds: string[] = []) {
  return useQuery({
    queryKey: ['public-names', userIds.sort()],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      
      const { data, error } = await supabase
        .rpc('get_full_names', { user_ids: userIds });

      if (error) {
        console.error('Error fetching public names:', error);
        throw error;
      }

      // Convert array to object for easy lookup
      const nameMap: Record<string, string> = {};
      data?.forEach((item: { user_id: string; full_name: string }) => {
        nameMap[item.user_id] = item.full_name || 'Não informado';
      });

      return nameMap;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}