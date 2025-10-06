import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePageVisibility } from '@/hooks/usePageVisibility';

export interface UserCertificationCount {
  userId: string;
  fullName: string;
  email: string;
  certificationCount: number;
}

export function useCertificationsByUser() {
  const { user, userRole } = useAuth();
  const isPageVisible = usePageVisibility();

  return useQuery({
    queryKey: ['certifications-by-user', user?.id, userRole],
    queryFn: async (): Promise<UserCertificationCount[]> => {
      if (!user) throw new Error('User not authenticated');

      // Get all certifications with valid status (exclude deactivated)
      const { data: certifications, error } = await supabase
        .from('certifications')
        .select('user_id')
        .neq('status', 'deactivated');

      if (error) throw error;

      // Count certifications per user
      const userCounts = new Map<string, number>();
      certifications?.forEach(cert => {
        const count = userCounts.get(cert.user_id) || 0;
        userCounts.set(cert.user_id, count + 1);
      });

      // Get user profiles
      const userIds = Array.from(userCounts.keys());
      if (userIds.length === 0) return [];

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Combine data and sort by certification count (descending)
      const result = profiles?.map(profile => ({
        userId: profile.user_id,
        fullName: profile.full_name || 'Não informado',
        email: profile.email || '',
        certificationCount: userCounts.get(profile.user_id) || 0
      })) || [];

      return result.sort((a, b) => b.certificationCount - a.certificationCount);
    },
    enabled: !!user && isPageVisible,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
