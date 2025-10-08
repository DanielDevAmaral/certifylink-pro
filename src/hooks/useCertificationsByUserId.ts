import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Certification = Tables<'certifications'>;

export function useCertificationsByUserId(userId?: string) {
  return useQuery({
    queryKey: ['certifications-by-user-id', userId],
    queryFn: async (): Promise<Certification[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching certifications by user:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId,
  });
}
