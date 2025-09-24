import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RecentAddition {
  id: string;
  type: 'certification' | 'technical_attestation' | 'legal_document' | 'badge';
  title: string;
  user_name: string;
  created_at: string;
  status: 'valid' | 'expiring' | 'expired' | 'pending';
  validity_date?: string | null;
  expiry_date?: string | null;
}

export interface RecentAdditionsFilters {
  type: 'certification' | 'technical_attestation' | 'legal_document' | 'badge';
  days?: 7 | 15 | 30;
}

export function useRecentAdditions(filters: RecentAdditionsFilters = { type: 'certification' }) {
  const { user } = useAuth();
  const { type = 'certification', days = 30 } = filters;
  
  return useQuery({
    queryKey: ['recent-additions', user?.id, type, days],
    queryFn: async (): Promise<RecentAddition[]> => {
      console.log('[Recent Additions] Fetching with filters:', { type, days });
      if (!user) throw new Error('User not authenticated');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffISOString = cutoffDate.toISOString();

      const additions: RecentAddition[] = [];

      // Build query based on specific filter type
      console.log(`[Recent Additions] Fetching ${type} for last ${days} days`);

      let query;
      let resultType;

      // Execute single query based on filter type
      switch (type) {
        case 'certification':
          query = supabase
            .from('certifications')
            .select(`
              id,
              name,
              validity_date,
              status,
              created_at,
              user_id
            `)
            .gte('created_at', cutoffISOString)
            .order('created_at', { ascending: false });
          resultType = 'certifications';
          break;

        case 'technical_attestation':
          query = supabase
            .from('technical_attestations')
            .select(`
              id,
              project_object,
              validity_date,
              status,
              created_at,
              user_id
            `)
            .gte('created_at', cutoffISOString)
            .order('created_at', { ascending: false });
          resultType = 'attestations';
          break;

        case 'legal_document':
          query = supabase
            .from('legal_documents')
            .select(`
              id,
              document_name,
              validity_date,
              status,
              created_at,
              user_id
            `)
            .gte('created_at', cutoffISOString)
            .order('created_at', { ascending: false });
          resultType = 'documents';
          break;

        case 'badge':
          query = supabase
            .from('badges')
            .select(`
              id,
              name,
              expiry_date,
              status,
              created_at,
              user_id
            `)
            .gte('created_at', cutoffISOString)
            .order('created_at', { ascending: false });
          resultType = 'badges';
          break;

        default:
          throw new Error(`Unsupported type: ${type}`);
      }

      // Execute query
      const { data: queryData, error: queryError } = await query;

      if (queryError) {
        console.error(`[Recent Additions] Error fetching ${type}:`, queryError);
        throw queryError;
      }

      console.log(`[Recent Additions] Found ${queryData?.length || 0} ${type} items`);

      // Get user names for the found items
      const userIds = [...new Set(queryData?.map((item: any) => item.user_id) || [])] as string[];
      let userNames: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        userNames = profiles?.reduce((acc, profile) => {
          acc[profile.user_id] = profile.full_name;
          return acc;
        }, {} as Record<string, string>) || {};
      }

      // Process results based on query type
      if (!queryData) return [];

      switch (resultType) {
        case 'certifications':
          queryData.forEach(cert => {
            additions.push({
              id: cert.id,
              type: 'certification',
              title: cert.name,
              user_name: userNames[cert.user_id] || 'Usuário não encontrado',
              created_at: cert.created_at,
              validity_date: cert.validity_date,
              status: cert.status as any
            });
          });
          break;

        case 'attestations':
          queryData.forEach(att => {
            additions.push({
              id: att.id,
              type: 'technical_attestation',
              title: att.project_object,
              user_name: userNames[att.user_id] || 'Usuário não encontrado',
              created_at: att.created_at,
              validity_date: att.validity_date,
              status: att.status as any
            });
          });
          break;

        case 'documents':
          queryData.forEach(doc => {
            additions.push({
              id: doc.id,
              type: 'legal_document',
              title: doc.document_name,
              user_name: userNames[doc.user_id] || 'Usuário não encontrado',
              created_at: doc.created_at,
              validity_date: doc.validity_date,
              status: doc.status as any
            });
          });
          break;

        case 'badges':
          queryData.forEach(badge => {
            additions.push({
              id: badge.id,
              type: 'badge',
              title: badge.name,
              user_name: userNames[badge.user_id] || 'Usuário não encontrado',
              created_at: badge.created_at,
              expiry_date: badge.expiry_date,
              status: badge.status as any
            });
          });
          break;
      }

      console.log(`[Recent Additions] Processed ${additions.length} items of type ${type}`);

      // Sort by creation date (most recent first)
      return additions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // Reduced to 1 minute for better refresh
    refetchOnWindowFocus: true, // Enable refresh on focus
    refetchOnMount: true, // Enable refresh on mount
  });
}