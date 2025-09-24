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
  type?: 'certification' | 'technical_attestation' | 'legal_document' | 'badge';
  days?: 7 | 15 | 30;
}

export function useRecentAdditions(filters: RecentAdditionsFilters = {}) {
  const { user } = useAuth();
  const { type, days = 30 } = filters;
  
  return useQuery({
    queryKey: ['recent-additions', user?.id, type, days],
    queryFn: async (): Promise<RecentAddition[]> => {
      console.log('[Recent Additions] Fetching with filters:', { type, days });
      if (!user) throw new Error('User not authenticated');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffISOString = cutoffDate.toISOString();

      const additions: RecentAddition[] = [];

      // Build queries based on filter type
      const shouldFetchCertifications = !type || type === 'certification';
      const shouldFetchAttestations = !type || type === 'technical_attestation';
      const shouldFetchDocuments = !type || type === 'legal_document';
      const shouldFetchBadges = !type || type === 'badge';

      console.log('[Recent Additions] Will fetch:', {
        certifications: shouldFetchCertifications,
        attestations: shouldFetchAttestations,
        documents: shouldFetchDocuments,
        badges: shouldFetchBadges
      });

      // Execute queries individually to avoid index confusion
      const promises = [];

      // Certifications
      if (shouldFetchCertifications) {
        promises.push(
          supabase
            .from('certifications')
            .select(`
              id,
              name,
              validity_date,
              status,
              created_at,
              profiles!left(full_name)
            `)
            .gte('created_at', cutoffISOString)
            .order('created_at', { ascending: false })
            .then(result => ({ type: 'certifications', data: result.data, error: result.error }))
        );
      }

      // Technical attestations
      if (shouldFetchAttestations) {
        promises.push(
          supabase
            .from('technical_attestations')
            .select(`
              id,
              project_object,
              validity_date,
              status,
              created_at,
              profiles!left(full_name)
            `)
            .gte('created_at', cutoffISOString)
            .order('created_at', { ascending: false })
            .then(result => ({ type: 'attestations', data: result.data, error: result.error }))
        );
      }

      // Legal documents
      if (shouldFetchDocuments) {
        promises.push(
          supabase
            .from('legal_documents')
            .select(`
              id,
              document_name,
              validity_date,
              status,
              created_at,
              profiles!left(full_name)
            `)
            .gte('created_at', cutoffISOString)
            .order('created_at', { ascending: false })
            .then(result => ({ type: 'documents', data: result.data, error: result.error }))
        );
      }

      // Badges
      if (shouldFetchBadges) {
        promises.push(
          supabase
            .from('badges')
            .select(`
              id,
              name,
              expiry_date,
              status,
              created_at,
              profiles!left(full_name)
            `)
            .gte('created_at', cutoffISOString)
            .order('created_at', { ascending: false })
            .then(result => ({ type: 'badges', data: result.data, error: result.error }))
        );
      }

      // Execute all queries in parallel
      const results = await Promise.all(promises);

      // Process results by type
      results.forEach(result => {
        if (result.error) {
          console.error(`[Recent Additions] Error fetching ${result.type}:`, result.error);
          return;
        }

        const data = result.data || [];
        console.log(`[Recent Additions] Found ${data.length} ${result.type}`);

        switch (result.type) {
          case 'certifications':
            data.forEach(cert => {
              additions.push({
                id: cert.id,
                type: 'certification',
                title: cert.name,
                user_name: (cert.profiles as any)?.full_name || 'Usuário não encontrado',
                created_at: cert.created_at,
                validity_date: cert.validity_date,
                status: cert.status as any
              });
            });
            break;

          case 'attestations':
            data.forEach(att => {
              additions.push({
                id: att.id,
                type: 'technical_attestation',
                title: att.project_object,
                user_name: (att.profiles as any)?.full_name || 'Usuário não encontrado',
                created_at: att.created_at,
                validity_date: att.validity_date,
                status: att.status as any
              });
            });
            break;

          case 'documents':
            data.forEach(doc => {
              additions.push({
                id: doc.id,
                type: 'legal_document',
                title: doc.document_name,
                user_name: (doc.profiles as any)?.full_name || 'Usuário não encontrado',
                created_at: doc.created_at,
                validity_date: doc.validity_date,
                status: doc.status as any
              });
            });
            break;

          case 'badges':
            data.forEach(badge => {
              additions.push({
                id: badge.id,
                type: 'badge',
                title: badge.name,
                user_name: (badge.profiles as any)?.full_name || 'Usuário não encontrado',
                created_at: badge.created_at,
                expiry_date: badge.expiry_date,
                status: badge.status as any
              });
            });
            break;
        }
      });

      console.log(`[Recent Additions] Total items found: ${additions.length}`);
      console.log('[Recent Additions] Items by type:', {
        certifications: additions.filter(a => a.type === 'certification').length,
        attestations: additions.filter(a => a.type === 'technical_attestation').length,
        documents: additions.filter(a => a.type === 'legal_document').length,
        badges: additions.filter(a => a.type === 'badge').length
      });

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