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
      if (!user) throw new Error('User not authenticated');

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Base query conditions based on user role
      let certQuery = supabase.from('certifications').select('*');
      let attQuery = supabase.from('technical_attestations').select('*');
      let docQuery = supabase.from('legal_documents').select('*');

      // All authenticated users can see all documents (RLS handles access control)

      const [certResult, attResult, docResult] = await Promise.all([
        certQuery,
        attQuery,
        docQuery
      ]);

      const certifications = certResult.data || [];
      const attestations = attResult.data || [];
      const documents = docResult.data || [];

      const allDocuments = [
        ...certifications.map(c => ({ ...c, category: 'Certificações', type: 'certification' })),
        ...attestations.map(a => ({ ...a, category: 'Atestados', type: 'attestation' })),
        ...documents.map(d => ({ ...d, category: 'Documentos', type: 'document' }))
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
        }
      ];

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
