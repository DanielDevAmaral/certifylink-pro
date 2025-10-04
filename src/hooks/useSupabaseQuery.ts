import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface DashboardStats {
  total_certifications: number;
  expiring_certifications: number;
  total_certificates: number;
  expiring_certificates: number;
  total_documents: number;
  expiring_documents: number;
  total_badges: number;
  expiring_badges: number;
  recent_uploads: number;
  completion_percentage: number;
  expiring_alert: number;
}

export interface RecentActivity {
  id: string;
  type: 'certification' | 'technical_attestation' | 'legal_document' | 'badge';
  title: string;
  user_name: string;
  validity_date: string | null;
  status: 'valid' | 'expiring' | 'expired';
  created_at: string;
}

export interface ExpiringItem {
  id: string;
  title: string;
  user_name: string;
  expires_in_days: number;
  type: 'certification' | 'technical_attestation' | 'legal_document' | 'badge';
  status: 'expiring' | 'expired';
}

// Hook para estatísticas do dashboard
export function useDashboardStats() {
  const { user, userRole } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-stats', user?.id, userRole],
    queryFn: async (): Promise<DashboardStats> => {
      console.log('[Dashboard Stats] Fetching data...');
      if (!user) throw new Error('User not authenticated');

      // Force status update before fetching
      await supabase.rpc('update_document_status');

      // Build queries based on user role - filter deactivated documents for regular users
      let certQuery = supabase.from('certifications').select('status, validity_date');
      let attQuery = supabase.from('technical_attestations').select('status, validity_date');
      let docQuery = supabase.from('legal_documents').select('status, validity_date');
      let badgeQuery = supabase.from('badges').select('status, expiry_date');

      // Filter out deactivated documents for regular users
      if (userRole !== 'admin' && userRole !== 'leader') {
        certQuery = certQuery.neq('status', 'deactivated');
        attQuery = attQuery.neq('status', 'deactivated');
        docQuery = docQuery.neq('status', 'deactivated');
        badgeQuery = badgeQuery.neq('status', 'deactivated');
      }

      // Query paralela para todas as estatísticas
      const [certificationsResult, attestationsResult, documentsResult, badgesResult] = await Promise.all([
        certQuery,
        attQuery,
        docQuery,
        badgeQuery
      ]);

      const certifications = certificationsResult.data || [];
      const attestations = attestationsResult.data || [];
      const documents = documentsResult.data || [];
      const badges = badgesResult.data || [];

      // Filter out deactivated documents from statistics (should already be filtered by query for regular users)
      const activeCertifications = certifications.filter(cert => cert.status !== 'deactivated');
      const activeAttestations = attestations.filter(att => att.status !== 'deactivated');
      const activeDocuments = documents.filter(doc => doc.status !== 'deactivated');
      const activeBadges = badges.filter(badge => badge.status !== 'deactivated');

      // Count only 'expiring' items for "vencendo em breve" - exclude already expired items and deactivated ones
      const expiringCertifications = activeCertifications.filter(cert => cert.status === 'expiring').length;
      const expiringAttestations = activeAttestations.filter(att => att.status === 'expiring').length;
      const expiringDocuments = activeDocuments.filter(doc => doc.status === 'expiring').length;
      const expiringBadges = activeBadges.filter(badge => badge.status === 'expiring').length;

      const totalDocuments = activeCertifications.length + activeAttestations.length + activeDocuments.length + activeBadges.length;
      const validDocuments = [...activeCertifications, ...activeAttestations, ...activeDocuments, ...activeBadges]
        .filter(item => item.status === 'valid').length;
      const allExpiringDocuments = [...activeCertifications, ...activeAttestations, ...activeDocuments, ...activeBadges]
        .filter(item => item.status === 'expiring').length;
      
      // Conformidade inclui documentos válidos + vencendo (ainda não vencidos)
      const compliantDocuments = validDocuments + allExpiringDocuments;
      const completionPercentage = totalDocuments > 0 
        ? Math.round((compliantDocuments / totalDocuments) * 100) 
        : 0;

      console.log('[Dashboard Stats] Data updated:', {
        total_certifications: certifications.length,
        expiring_certifications: expiringCertifications,
        total_certificates: attestations.length,
        expiring_certificates: expiringAttestations,
        total_documents: documents.length,
        expiring_documents: expiringDocuments,
        total_badges: badges.length,
        expiring_badges: expiringBadges,
        completion_percentage: completionPercentage
      });

      return {
        total_certifications: activeCertifications.length,
        expiring_certifications: expiringCertifications,
        total_certificates: activeAttestations.length,
        expiring_certificates: expiringAttestations,
        total_documents: activeDocuments.length,
        expiring_documents: expiringDocuments,
        total_badges: activeBadges.length,
        expiring_badges: expiringBadges,
        recent_uploads: 0, // Será implementado com auditoria
        completion_percentage: completionPercentage,
        expiring_alert: expiringCertifications + expiringAttestations + expiringDocuments + expiringBadges // Total de documentos vencendo como alerta
      };
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // Reduced to 1 minute
    refetchOnWindowFocus: true, // Enable refresh on focus
    refetchOnMount: true, // Enable refresh on mount
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}

// Hook para atividade recente
export function useRecentActivity() {
  const { user, userRole } = useAuth();
  
  return useQuery({
    queryKey: ['recent-activity', user?.id, userRole],
    queryFn: async (): Promise<RecentActivity[]> => {
      console.log('[Recent Activity] Fetching data...');
      if (!user) throw new Error('User not authenticated');

      // Build queries based on user role
      let certQuery = supabase
        .from('certifications')
        .select(`
          id,
          name,
          validity_date,
          status,
          created_at,
          profiles!left(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      let attQuery = supabase
        .from('technical_attestations')
        .select(`
          id,
          project_object,
          validity_date,
          status,
          created_at,
          profiles!left(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      let docQuery = supabase
        .from('legal_documents')
        .select(`
          id,
          document_name,
          validity_date,
          status,
          created_at,
          profiles!left(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      let badgeQuery = supabase
        .from('badges')
        .select(`
          id,
          name,
          expiry_date,
          status,
          created_at,
          profiles!left(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Filter out deactivated documents for regular users in recent activity
      if (userRole !== 'admin' && userRole !== 'leader') {
        certQuery = certQuery.neq('status', 'deactivated');
        attQuery = attQuery.neq('status', 'deactivated');
        docQuery = docQuery.neq('status', 'deactivated');
        badgeQuery = badgeQuery.neq('status', 'deactivated');
      }

      // Buscar atividades recentes de diferentes tabelas
      const [certificationsResult, attestationsResult, documentsResult, badgesResult] = await Promise.all([
        certQuery,
        attQuery,
        docQuery,
        badgeQuery
      ]);

      const activities: RecentActivity[] = [];

      // Processar certificações
      certificationsResult.data?.forEach(cert => {
        activities.push({
          id: cert.id,
          type: 'certification',
          title: cert.name,
            user_name: (cert.profiles as any)?.full_name || 'Usuário não encontrado',
          validity_date: cert.validity_date,
          status: cert.status as any,
          created_at: cert.created_at
        });
      });

      // Processar atestados
      attestationsResult.data?.forEach(att => {
        activities.push({
          id: att.id,
          type: 'technical_attestation',
          title: att.project_object,
            user_name: (att.profiles as any)?.full_name || 'Usuário não encontrado',
          validity_date: att.validity_date,
          status: att.status as any,
          created_at: att.created_at
        });
      });

      // Processar documentos
      documentsResult.data?.forEach(doc => {
        activities.push({
          id: doc.id,
          type: 'legal_document',
          title: doc.document_name,
            user_name: (doc.profiles as any)?.full_name || 'Usuário não encontrado',
          validity_date: doc.validity_date,
          status: doc.status as any,
          created_at: doc.created_at
        });
      });

      // Processar badges
      badgesResult.data?.forEach(badge => {
        activities.push({
          id: badge.id,
          type: 'badge',
          title: badge.name,
          user_name: (badge.profiles as any)?.full_name || 'Usuário não encontrado',
          validity_date: badge.expiry_date,
          status: badge.status as any,
          created_at: badge.created_at
        });
      });

      console.log('[Recent Activity] Found activities:', activities.length);

      // Ordenar por data mais recente e limitar a 10
      return activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // Reduced to 1 minute
    refetchOnWindowFocus: true, // Enable refresh on focus
    refetchOnMount: true, // Enable refresh on mount
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}

// Hook para itens vencendo
export function useExpiringItems() {
  const { user, userRole } = useAuth();
  
  return useQuery({
    queryKey: ['expiring-items', user?.id, userRole],
    queryFn: async (): Promise<ExpiringItem[]> => {
      console.log('[Expiring Items] Fetching data...');
      if (!user) throw new Error('User not authenticated');

      // Force status update before fetching
      await supabase.rpc('update_document_status');

      const now = new Date();
      const expiringItems: ExpiringItem[] = [];

      // Get ALL documents and dynamically calculate which ones are expiring
      const [certResult, attResult, docResult, badgeResult] = await Promise.all([
        supabase
          .from('certifications')
          .select(`
            id,
            name,
            validity_date,
            status,
            profiles!left(full_name)
          `)
          .order('validity_date', { ascending: true, nullsFirst: false }),
        
        supabase
          .from('technical_attestations')
          .select(`
            id,
            project_object,
            validity_date,
            status,
            profiles!left(full_name)
          `)
          .order('validity_date', { ascending: true, nullsFirst: false }),
        
        supabase
          .from('legal_documents')
          .select(`
            id,
            document_name,
            validity_date,
            status,
            profiles!left(full_name)
          `)
          .order('validity_date', { ascending: true, nullsFirst: false }),

        supabase
          .from('badges')
          .select(`
            id,
            name,
            expiry_date,
            status,
            profiles!left(full_name)
          `)
          .order('expiry_date', { ascending: true, nullsFirst: false })
      ]);

      // Filter out deactivated documents from expiring items for regular users
      const filterResults = (data: any[]) => {
        if (userRole !== 'admin' && userRole !== 'leader') {
          return data?.filter(item => item.status !== 'deactivated') || [];
        }
        return data || [];
      };

      // Process certifications - only include items that are actually expiring/expired
      const filteredCertifications = filterResults(certResult.data);
      if (filteredCertifications.length > 0) {
        filteredCertifications.forEach(cert => {
          if (!cert.validity_date) return; // Skip items without expiry date
          
          const expiryDate = new Date(cert.validity_date + 'T00:00:00');
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Only include expiring items (within 30 days), show expired separately if needed
          if ((daysUntilExpiry <= 30) && cert.status === 'expiring') {
            expiringItems.push({
              id: cert.id,
              title: cert.name,
              user_name: (cert.profiles as any)?.full_name || 'Usuário não encontrado',
              expires_in_days: Math.max(0, daysUntilExpiry), // Don't show negative days
              type: 'certification',
              status: 'expiring' as const
            });
          }
        });
      }

      // Process technical attestations
      const filteredAttestations = filterResults(attResult.data);
      if (filteredAttestations.length > 0) {
        filteredAttestations.forEach(att => {
          if (!att.validity_date) return;
          
          const expiryDate = new Date(att.validity_date + 'T00:00:00');
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if ((daysUntilExpiry <= 30) && att.status === 'expiring') {
            expiringItems.push({
              id: att.id,
              title: att.project_object,
              user_name: (att.profiles as any)?.full_name || 'Usuário não encontrado',
              expires_in_days: Math.max(0, daysUntilExpiry),
              type: 'technical_attestation',
              status: 'expiring' as const
            });
          }
        });
      }

      // Process legal documents
      const filteredDocuments = filterResults(docResult.data);
      if (filteredDocuments.length > 0) {
        filteredDocuments.forEach(doc => {
          if (!doc.validity_date) return;
          
          const expiryDate = new Date(doc.validity_date + 'T00:00:00');
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if ((daysUntilExpiry <= 30) && doc.status === 'expiring') {
            expiringItems.push({
              id: doc.id,
              title: doc.document_name,
              user_name: (doc.profiles as any)?.full_name || 'Usuário não encontrado',
              expires_in_days: Math.max(0, daysUntilExpiry),
              type: 'legal_document',
              status: 'expiring' as const
            });
          }
        });
      }

      // Process badges
      const filteredBadges = filterResults(badgeResult.data);
      if (filteredBadges.length > 0) {
        filteredBadges.forEach(badge => {
          if (!badge.expiry_date) return;
          
          const expiryDate = new Date(badge.expiry_date + 'T00:00:00');
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if ((daysUntilExpiry <= 30) && badge.status === 'expiring') {
            expiringItems.push({
              id: badge.id,
              title: badge.name,
              user_name: (badge.profiles as any)?.full_name || 'Usuário não encontrado',
              expires_in_days: Math.max(0, daysUntilExpiry),
              type: 'badge',
              status: 'expiring' as const
            });
          }
        });
      }

      console.log('[Expiring Items] Found items:', expiringItems.length);

      // Ordenar por data de vencimento mais próxima
      return expiringItems.sort((a, b) => a.expires_in_days - b.expires_in_days);
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // Reduced to 1 minute
    refetchOnWindowFocus: true, // Enable refresh on focus
    refetchOnMount: true, // Enable refresh on mount
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}