import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';

export interface AnalyticsData {
  totalDocuments: number;
  validDocuments: number;
  expiringDocuments: number;
  expiredDocuments: number;
  complianceRate: number;
  expiringAlert: number;
  monthlyTrend: Array<{
    month: string;
    total: number;
    compliance: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    valid: number;
    expiring: number;
    expired: number;
  }>;
}

export interface DashboardFilters {
  categories?: string[];
  platforms?: string[];
  statuses?: string[];
  dateRange?: {
    start: Date | null;
    end: Date | null;
  } | null;
}

export function useDashboardAnalytics(filters?: DashboardFilters) {
  const { user, userRole } = useAuth();
  const isPageVisible = usePageVisibility();

  const currentDate = useMemo(() => new Date(), []);
  const sixMonthsAgo = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1), [currentDate]);

  return useQuery({
    queryKey: ['dashboard-analytics', user?.id, userRole, filters],
    queryFn: async (): Promise<AnalyticsData> => {
      console.log('[Dashboard Analytics] Fetching data...');
      if (!user) throw new Error('User not authenticated');

      // Force status update before fetching
      await supabase.rpc('update_document_status');

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Base query conditions based on user role
      let certQuery = supabase.from('certifications').select('*');
      let attQuery = supabase.from('technical_attestations').select('*');
      let docQuery = supabase.from('legal_documents').select('*');
      let badgeQuery = supabase.from('badges').select('*');

      // Filter out deactivated documents for regular users
      // Leaders and admins can see deactivated documents
      if (userRole !== 'admin' && userRole !== 'leader') {
        certQuery = certQuery.neq('status', 'deactivated');
        attQuery = attQuery.neq('status', 'deactivated');
        docQuery = docQuery.neq('status', 'deactivated');
        badgeQuery = badgeQuery.neq('status', 'deactivated');
      }

      const [certResult, attResult, docResult, badgeResult] = await Promise.all([
        certQuery,
        attQuery,
        docQuery,
        badgeQuery
      ]);

      const certifications = certResult.data || [];
      const attestations = attResult.data || [];
      const documents = docResult.data || [];
      const badges = badgeResult.data || [];

      const allDocuments = [
        ...certifications.map(c => ({ ...c, category: 'Certificações', type: 'certification' })),
        ...attestations.map(a => ({ ...a, category: 'Atestados', type: 'attestation' })),
        ...documents.map(d => ({ ...d, category: 'Documentos', type: 'document' })),
        ...badges.map(b => ({ ...b, category: 'Badges', type: 'badge' }))
      ];

      // Filter active documents for statistics (exclude deactivated ones)
      let filteredDocuments = allDocuments.filter(doc => doc.status !== 'deactivated');

      // Apply filters if provided
      if (filters) {
        if (filters.categories && filters.categories.length > 0) {
          filteredDocuments = filteredDocuments.filter(doc => 
            filters.categories!.includes(doc.category)
          );
        }
        if (filters.statuses && filters.statuses.length > 0) {
          filteredDocuments = filteredDocuments.filter(doc => 
            filters.statuses!.includes(doc.status)
          );
        }
        if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          filteredDocuments = filteredDocuments.filter(doc => {
            const docDate = new Date(doc.created_at);
            return docDate >= startDate && docDate <= endDate;
          });
        }
      }
      const totalDocuments = filteredDocuments.length;
      
      // Use database status field which is now automatically updated (only count active documents)
      const expiredDocuments = filteredDocuments.filter(doc => doc.status === 'expired').length;
      const expiringDocuments = filteredDocuments.filter(doc => doc.status === 'expiring').length;
      const validDocuments = filteredDocuments.filter(doc => doc.status === 'valid').length;

      const compliantDocuments = validDocuments + expiringDocuments; // Conformidade inclui válidos + vencendo
      const complianceRate = totalDocuments > 0 ? 
        Math.round((compliantDocuments / totalDocuments) * 100) : 0;

      // Generate monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
        
        // Only count active documents in monthly trends
        const monthDocs = filteredDocuments.filter(doc => {
          const docDate = new Date(doc.created_at);
          return docDate.getMonth() === date.getMonth() && 
                 docDate.getFullYear() === date.getFullYear();
        });

        const monthValid = monthDocs.filter(doc => doc.status === 'valid').length;
        const monthExpiring = monthDocs.filter(doc => doc.status === 'expiring').length;
        const monthCompliant = monthValid + monthExpiring; // Conformidade inclui válidos + vencendo
        const monthCompliance = monthDocs.length > 0 ? 
          Math.round((monthCompliant / monthDocs.length) * 100) : 0;

        monthlyTrend.push({
          month: monthName,
          total: monthDocs.length,
          compliance: monthCompliance
        });
      }

      // Category breakdown - using database status field (exclude deactivated documents from counts)
      const activeCertifications = certifications.filter(c => c.status !== 'deactivated');
      const activeAttestations = attestations.filter(a => a.status !== 'deactivated');
      const activeLegalDocuments = documents.filter(d => d.status !== 'deactivated');
      const activeBadges = badges.filter(b => b.status !== 'deactivated');
      
      const categoryBreakdown = [
        {
          category: 'Certificações',
          count: activeCertifications.length,
          expired: activeCertifications.filter(c => c.status === 'expired').length,
          expiring: activeCertifications.filter(c => c.status === 'expiring').length,
          valid: activeCertifications.filter(c => c.status === 'valid').length
        },
        {
          category: 'Atestados',
          count: activeAttestations.length,
          expired: activeAttestations.filter(a => a.status === 'expired').length,
          expiring: activeAttestations.filter(a => a.status === 'expiring').length,
          valid: activeAttestations.filter(a => a.status === 'valid').length
        },
        {
          category: 'Documentos',
          count: activeLegalDocuments.length,
          expired: activeLegalDocuments.filter(d => d.status === 'expired').length,
          expiring: activeLegalDocuments.filter(d => d.status === 'expiring').length,
          valid: activeLegalDocuments.filter(d => d.status === 'valid').length
        },
        {
          category: 'Badges',
          count: activeBadges.length,
          expired: activeBadges.filter(b => b.status === 'expired').length,
          expiring: activeBadges.filter(b => b.status === 'expiring').length,
          valid: activeBadges.filter(b => b.status === 'valid').length
        }
      ];

      console.log('[Dashboard Analytics] Data updated:', {
        totalDocuments,
        validDocuments,
        expiringDocuments,
        expiredDocuments,
        complianceRate
      });

      return {
        totalDocuments,
        validDocuments,
        expiringDocuments,
        expiredDocuments,
        complianceRate,
        expiringAlert: expiringDocuments, // Alerta específico para documentos vencendo
        monthlyTrend,
        categoryBreakdown
      };
    },
    enabled: !!user && isPageVisible,
    staleTime: 1 * 60 * 1000, // Reduced to 1 minute
    refetchOnWindowFocus: true, // Enable refresh on focus
    refetchOnMount: true, // Enable refresh on mount
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}
