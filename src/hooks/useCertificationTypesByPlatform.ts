import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CertificationTypesByPlatform {
  platformId: string;
  platformName: string;
  platformLogo?: string;
  types: Array<{
    id: string;
    name: string;
    fullName: string;
    function?: string;
  }>;
}

export function useCertificationTypesByPlatform() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['certification-types-by-platform', user?.id],
    queryFn: async () => {
      // Fetch all active certification types with platform info
      const { data: types, error: typesError } = await supabase
        .from('certification_types')
        .select(`
          id,
          name,
          full_name,
          function,
          platform_id,
          certification_platforms (
            id,
            name,
            logo_url
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (typesError) throw typesError;

      // Group by platform
      const grouped = new Map<string, CertificationTypesByPlatform>();

      types?.forEach(type => {
        const platform = (type.certification_platforms as any);
        const platformId = type.platform_id;
        
        if (!grouped.has(platformId)) {
          grouped.set(platformId, {
            platformId,
            platformName: platform?.name || 'Sem Plataforma',
            platformLogo: platform?.logo_url,
            types: []
          });
        }

        grouped.get(platformId)!.types.push({
          id: type.id,
          name: type.name,
          fullName: type.full_name,
          function: type.function || undefined
        });
      });

      return Array.from(grouped.values()).sort((a, b) => 
        a.platformName.localeCompare(b.platformName)
      );
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
