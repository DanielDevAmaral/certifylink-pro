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

      const queries = [];

      if (shouldFetchCertifications) {
        queries.push(
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
        );
      }

      if (shouldFetchAttestations) {
        queries.push(
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
        );
      }

      if (shouldFetchDocuments) {
        queries.push(
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
        );
      }

      if (shouldFetchBadges) {
        queries.push(
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
        );
      }

      // Execute queries in parallel
      const results = await Promise.all(queries);
      let resultIndex = 0;

      // Process certifications
      if (shouldFetchCertifications) {
        const certificationsResult = results[resultIndex++];
        certificationsResult.data?.forEach(cert => {
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
      }

      // Process technical attestations
      if (shouldFetchAttestations) {
        const attestationsResult = results[resultIndex++];
        attestationsResult.data?.forEach(att => {
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
      }

      // Process legal documents
      if (shouldFetchDocuments) {
        const documentsResult = results[resultIndex++];
        documentsResult.data?.forEach(doc => {
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
      }

      // Process badges
      if (shouldFetchBadges) {
        const badgesResult = results[resultIndex++];
        badgesResult.data?.forEach(badge => {
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
      }

      // Sort by creation date (most recent first)
      return additions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}