import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePageVisibility } from '@/hooks/usePageVisibility';

export interface CertificationPlatformData {
  platform: string;
  count: number;
  valid: number;
  expiring: number;
  expired: number;
  color: string;
}

export interface PlatformFilters {
  platforms?: string[];
  statuses?: string[];
  dateRange?: {
    start: Date | null;
    end: Date | null;
  } | null;
}

export function useCertificationsByPlatform(filters?: PlatformFilters) {
  const { user, userRole } = useAuth();
  const isPageVisible = usePageVisibility();

  return useQuery({
    queryKey: ['certifications-by-platform', user?.id, userRole, filters],
    queryFn: async (): Promise<CertificationPlatformData[]> => {
      if (!user) throw new Error('User not authenticated');

      // Get certification platforms first
      const { data: platforms, error: platformsError } = await supabase
        .from('certification_platforms')
        .select('id, name')
        .order('name');

      if (platformsError) throw platformsError;

      // Get certification types with platform info
      const { data: certTypes, error: typesError } = await supabase
        .from('certification_types')
        .select(`
          id, 
          name, 
          platform_id,
          certification_platforms!inner(name)
        `);

      if (typesError) throw typesError;

      // Get certifications
      let certQuery = supabase
        .from('certifications')
        .select('name, status, created_at');

      // Filter out deactivated documents for regular users
      if (userRole !== 'admin' && userRole !== 'leader') {
        certQuery = certQuery.neq('status', 'deactivated');
      }

      // Apply status filter
      if (filters?.statuses && filters.statuses.length > 0) {
        certQuery = certQuery.in('status', filters.statuses as any);
      }

      // Apply date range filter
      if (filters?.dateRange && filters.dateRange.start && filters.dateRange.end) {
        certQuery = certQuery
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }

      const { data: certifications, error: certError } = await certQuery;
      if (certError) throw certError;

      // Create platform mapping
      const platformMap = new Map();
      
      // Initialize all platforms with zero counts
      platforms?.forEach((platform, index) => {
        platformMap.set(platform.name, {
          platform: platform.name,
          count: 0,
          valid: 0,
          expiring: 0,
          expired: 0,
          color: getColorForIndex(index)
        });
      });

      // Process certifications and match with platforms
      certifications?.forEach(cert => {
        // Try to match certification name with platform
        let matchedPlatform = null;
        
        // First try to match with certification types
        const matchedType = certTypes?.find(type => 
          cert.name.toLowerCase().includes(type.name.toLowerCase()) ||
          type.name.toLowerCase().includes(cert.name.toLowerCase())
        );
        
        if (matchedType?.certification_platforms?.name) {
          matchedPlatform = matchedType.certification_platforms.name;
        } else {
          // Fallback: try to match directly with platform names
          const foundPlatform = platforms?.find(platform =>
            cert.name.toLowerCase().includes(platform.name.toLowerCase()) ||
            platform.name.toLowerCase().includes(cert.name.toLowerCase())
          );
          matchedPlatform = foundPlatform?.name;
        }

        // If no platform matched, categorize as "Outros"
        if (!matchedPlatform) {
          matchedPlatform = 'Outros';
          if (!platformMap.has('Outros')) {
            platformMap.set('Outros', {
              platform: 'Outros',
              count: 0,
              valid: 0,
              expiring: 0,
              expired: 0,
              color: '#6B7280'
            });
          }
        }

        const platformData = platformMap.get(matchedPlatform);
        if (platformData) {
          platformData.count++;
          if (cert.status === 'valid') platformData.valid++;
          else if (cert.status === 'expiring') platformData.expiring++;
          else if (cert.status === 'expired') platformData.expired++;
        }
      });

      // Convert map to array and filter out platforms with no certifications
      let result = Array.from(platformMap.values())
        .filter(platform => platform.count > 0);

      // Apply platform filter if provided
      if (filters?.platforms && filters.platforms.length > 0) {
        result = result.filter(platform => filters.platforms!.includes(platform.platform));
      }

      return result.sort((a, b) => b.count - a.count);
    },
    enabled: !!user && isPageVisible,
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 2 * 60 * 1000,
  });
}

// Helper function to get colors for platforms
function getColorForIndex(index: number): string {
  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
  ];
  return colors[index % colors.length];
}