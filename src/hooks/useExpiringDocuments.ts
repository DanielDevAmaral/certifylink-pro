import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ExpiringDocument {
  id: string;
  name: string;
  type: 'certification' | 'badge' | 'technical_attestation' | 'legal_document';
  expiry_date: string;
  status: string;
  user_id: string;
  user_name?: string;
  days_until_expiry: number;
}

export interface DetailedFilters {
  categories?: string[];
  platforms?: string[];
  statuses?: string[];
  dateRange?: { start: Date | null; end: Date | null } | null;
  users?: string[];
}

export function useExpiringDocuments(days: number = 60, detailedFilters?: DetailedFilters) {
  const { user, userRole } = useAuth();

  return useQuery({
    queryKey: ['expiring-documents', days, detailedFilters],
    queryFn: async (): Promise<ExpiringDocument[]> => {
      if (userRole !== 'admin') {
        throw new Error('Access denied');
      }

      const today = new Date();
      const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const todayStr = today.toISOString().split('T')[0];
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const results: ExpiringDocument[] = [];

      // Fetch expiring certifications
      const { data: certs, error: certsError } = await supabase
        .from('certifications')
        .select(`
          id,
          name,
          validity_date,
          status,
          user_id,
          profiles:user_id (full_name)
        `)
        .gte('validity_date', todayStr)
        .lte('validity_date', futureDateStr)
        .neq('status', 'deactivated')
        .order('validity_date', { ascending: true });

      if (!certsError && certs) {
        certs.forEach(cert => {
          const daysUntil = Math.ceil(
            (new Date(cert.validity_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          results.push({
            id: cert.id,
            name: cert.name,
            type: 'certification',
            expiry_date: cert.validity_date,
            status: cert.status,
            user_id: cert.user_id,
            user_name: (cert.profiles as any)?.full_name,
            days_until_expiry: daysUntil
          });
        });
      }

      // Fetch expiring badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select(`
          id,
          name,
          expiry_date,
          status,
          user_id,
          profiles:user_id (full_name)
        `)
        .gte('expiry_date', todayStr)
        .lte('expiry_date', futureDateStr)
        .neq('status', 'deactivated')
        .order('expiry_date', { ascending: true });

      if (!badgesError && badges) {
        badges.forEach(badge => {
          const daysUntil = Math.ceil(
            (new Date(badge.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          results.push({
            id: badge.id,
            name: badge.name,
            type: 'badge',
            expiry_date: badge.expiry_date,
            status: badge.status,
            user_id: badge.user_id,
            user_name: (badge.profiles as any)?.full_name,
            days_until_expiry: daysUntil
          });
        });
      }

      // Fetch expiring technical attestations
      const { data: techs, error: techsError } = await supabase
        .from('technical_attestations')
        .select(`
          id,
          project_object,
          validity_date,
          status,
          user_id,
          profiles:user_id (full_name)
        `)
        .gte('validity_date', todayStr)
        .lte('validity_date', futureDateStr)
        .neq('status', 'deactivated')
        .order('validity_date', { ascending: true });

      if (!techsError && techs) {
        techs.forEach(tech => {
          const daysUntil = Math.ceil(
            (new Date(tech.validity_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          results.push({
            id: tech.id,
            name: tech.project_object,
            type: 'technical_attestation',
            expiry_date: tech.validity_date,
            status: tech.status,
            user_id: tech.user_id,
            user_name: (tech.profiles as any)?.full_name,
            days_until_expiry: daysUntil
          });
        });
      }

      // Fetch expiring legal documents
      const { data: legals, error: legalsError } = await supabase
        .from('legal_documents')
        .select(`
          id,
          document_name,
          validity_date,
          status,
          user_id,
          profiles:user_id (full_name)
        `)
        .gte('validity_date', todayStr)
        .lte('validity_date', futureDateStr)
        .neq('status', 'deactivated')
        .order('validity_date', { ascending: true });

      if (!legalsError && legals) {
        legals.forEach(legal => {
          const daysUntil = Math.ceil(
            (new Date(legal.validity_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          results.push({
            id: legal.id,
            name: legal.document_name,
            type: 'legal_document',
            expiry_date: legal.validity_date,
            status: legal.status,
            user_id: legal.user_id,
            user_name: (legal.profiles as any)?.full_name,
            days_until_expiry: daysUntil
          });
        });
      }

      // Apply detailed filters if provided
      let filteredResults = results;
      
      if (detailedFilters) {
        filteredResults = results.filter(item => {
          // Filter by categories (map types to categories)
          if (detailedFilters.categories && detailedFilters.categories.length > 0) {
            const categoryMap: Record<string, string> = {
              'certification': 'Certificações',
              'badge': 'Badges',
              'technical_attestation': 'Atestados',
              'legal_document': 'Documentos'
            };
            const itemCategory = categoryMap[item.type];
            if (!detailedFilters.categories.includes(itemCategory)) return false;
          }

          // Filter by status
          if (detailedFilters.statuses && detailedFilters.statuses.length > 0) {
            if (!detailedFilters.statuses.includes(item.status)) return false;
          }

          // Filter by date range (expiry date)
          if (detailedFilters.dateRange?.start || detailedFilters.dateRange?.end) {
            const itemDate = new Date(item.expiry_date);
            if (detailedFilters.dateRange.start && itemDate < detailedFilters.dateRange.start) return false;
            if (detailedFilters.dateRange.end && itemDate > detailedFilters.dateRange.end) return false;
          }

          return true;
        });
      }

      // Sort by days until expiry
      return filteredResults.sort((a, b) => a.days_until_expiry - b.days_until_expiry);
    },
    enabled: !!user && userRole === 'admin',
    refetchInterval: 60000 // Refresh every minute
  });
}
