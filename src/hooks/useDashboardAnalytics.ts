import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AnalyticsData {
  totalDocuments: number;
  validDocuments: number;
  expiringDocuments: number;
  expiredDocuments: number;
  complianceRate: number;
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
  const { user, userRole } = useAuth();

  return useQuery({
    queryKey: ['dashboard-analytics', user?.id, userRole],
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
      
      // Use mutually exclusive categorization based on validity date priority
      const expiredDocuments = allDocuments.filter(doc => {
        if (!doc.validity_date) return false;
        return new Date(doc.validity_date) <= now;
      }).length;
      
      const expiringDocuments = allDocuments.filter(doc => {
        if (!doc.validity_date) return false;
        const validityDate = new Date(doc.validity_date);
        return validityDate > now && validityDate <= thirtyDaysFromNow;
      }).length;
      
      const validDocuments = allDocuments.filter(doc => {
        if (!doc.validity_date) return true; // No expiry date = valid
        const validityDate = new Date(doc.validity_date);
        return validityDate > thirtyDaysFromNow;
      }).length;

      const complianceRate = totalDocuments > 0 ? 
        Math.round((validDocuments / totalDocuments) * 100) : 0;

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
        const monthCompliance = monthDocs.length > 0 ? 
          Math.round((monthValid / monthDocs.length) * 100) : 0;

        monthlyTrend.push({
          month: monthName,
          total: monthDocs.length,
          compliance: monthCompliance
        });
      }

      // Category breakdown - using same mutually exclusive logic
      const categoryBreakdown = [
        {
          category: 'Certificações',
          count: certifications.length,
          expired: certifications.filter(c => {
            if (!c.validity_date) return false;
            return new Date(c.validity_date) <= now;
          }).length,
          expiring: certifications.filter(c => {
            if (!c.validity_date) return false;
            const validityDate = new Date(c.validity_date);
            return validityDate > now && validityDate <= thirtyDaysFromNow;
          }).length,
          valid: certifications.filter(c => {
            if (!c.validity_date) return true;
            const validityDate = new Date(c.validity_date);
            return validityDate > thirtyDaysFromNow;
          }).length
        },
        {
          category: 'Atestados',
          count: attestations.length,
          expired: attestations.filter(a => {
            if (!a.validity_date) return false;
            return new Date(a.validity_date) <= now;
          }).length,
          expiring: attestations.filter(a => {
            if (!a.validity_date) return false;
            const validityDate = new Date(a.validity_date);
            return validityDate > now && validityDate <= thirtyDaysFromNow;
          }).length,
          valid: attestations.filter(a => {
            if (!a.validity_date) return true;
            const validityDate = new Date(a.validity_date);
            return validityDate > thirtyDaysFromNow;
          }).length
        },
        {
          category: 'Documentos',
          count: documents.length,
          expired: documents.filter(d => {
            if (!d.validity_date) return false;
            return new Date(d.validity_date) <= now;
          }).length,
          expiring: documents.filter(d => {
            if (!d.validity_date) return false;
            const validityDate = new Date(d.validity_date);
            return validityDate > now && validityDate <= thirtyDaysFromNow;
          }).length,
          valid: documents.filter(d => {
            if (!d.validity_date) return true;
            const validityDate = new Date(d.validity_date);
            return validityDate > thirtyDaysFromNow;
          }).length
        }
      ];

      return {
        totalDocuments,
        validDocuments,
        expiringDocuments,
        expiredDocuments,
        complianceRate,
        monthlyTrend,
        categoryBreakdown
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
