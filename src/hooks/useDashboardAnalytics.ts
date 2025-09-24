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

export function useDashboardAnalytics() {
  const { user } = useAuth();
  const isPageVisible = usePageVisibility();

  const currentDate = useMemo(() => new Date(), []);
  const sixMonthsAgo = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1), [currentDate]);

  return useQuery({
    queryKey: ['dashboard-analytics', user?.id],
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

      // All authenticated users can see all documents (RLS handles access control)

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

      const totalDocuments = allDocuments.length;
      
      // Use database status field which is now automatically updated
      const expiredDocuments = allDocuments.filter(doc => doc.status === 'expired').length;
      const expiringDocuments = allDocuments.filter(doc => doc.status === 'expiring').length;
      const validDocuments = allDocuments.filter(doc => doc.status === 'valid').length;

      const compliantDocuments = validDocuments + expiringDocuments; // Conformidade inclui válidos + vencendo
      const complianceRate = totalDocuments > 0 ? 
        Math.round((compliantDocuments / totalDocuments) * 100) : 0;

      // Generate monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
        
        const monthDocs = allDocuments.filter(doc => {
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

      // Category breakdown - using database status field
      const categoryBreakdown = [
        {
          category: 'Certificações',
          count: certifications.length,
          expired: certifications.filter(c => c.status === 'expired').length,
          expiring: certifications.filter(c => c.status === 'expiring').length,
          valid: certifications.filter(c => c.status === 'valid').length
        },
        {
          category: 'Atestados',
          count: attestations.length,
          expired: attestations.filter(a => a.status === 'expired').length,
          expiring: attestations.filter(a => a.status === 'expiring').length,
          valid: attestations.filter(a => a.status === 'valid').length
        },
        {
          category: 'Documentos',
          count: documents.length,
          expired: documents.filter(d => d.status === 'expired').length,
          expiring: documents.filter(d => d.status === 'expiring').length,
          valid: documents.filter(d => d.status === 'valid').length
        },
        {
          category: 'Badges',
          count: badges.length,
          expired: badges.filter(b => b.status === 'expired').length,
          expiring: badges.filter(b => b.status === 'expiring').length,
          valid: badges.filter(b => b.status === 'valid').length
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
