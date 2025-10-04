import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { subMonths, endOfMonth, subDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

      // Get certification platforms and types for matching
      const { data: platforms } = await supabase
        .from('certification_platforms')
        .select('id, name');

      const { data: certTypes } = await supabase
        .from('certification_types')
        .select('id, name, full_name, aliases, platform_id, certification_platforms!inner(name)');

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

      // Helper function to match certification with platform
      const matchCertificationPlatform = (certName: string): string | null => {
        const matchedType = certTypes?.find(type => {
          const nameLower = certName.toLowerCase();
          const typeNameLower = type.name.toLowerCase();
          const fullNameLower = type.full_name?.toLowerCase() || '';
          
          if (nameLower.includes(typeNameLower) || typeNameLower.includes(nameLower)) {
            return true;
          }
          if (fullNameLower && (nameLower.includes(fullNameLower) || fullNameLower.includes(nameLower))) {
            return true;
          }
          
          if (type.aliases && Array.isArray(type.aliases)) {
            return type.aliases.some((alias: string) => {
              const aliasLower = alias.toLowerCase();
              return nameLower.includes(aliasLower) || aliasLower.includes(nameLower);
            });
          }
          
          return false;
        });
        
        if (matchedType?.certification_platforms?.name) {
          return matchedType.certification_platforms.name;
        }
        
        const foundPlatform = platforms?.find(platform =>
          certName.toLowerCase().includes(platform.name.toLowerCase()) ||
          platform.name.toLowerCase().includes(certName.toLowerCase())
        );
        
        return foundPlatform?.name || null;
      };

      const allDocuments = [
        ...certifications.map(c => ({ 
          ...c, 
          category: 'Certificações', 
          type: 'certification',
          platform: matchCertificationPlatform(c.name)
        })),
        ...attestations.map(a => ({ ...a, category: 'Atestados', type: 'attestation', platform: null })),
        ...documents.map(d => ({ ...d, category: 'Documentos', type: 'document', platform: null })),
        ...badges.map(b => ({ ...b, category: 'Badges', type: 'badge', platform: null }))
      ];

      // Filter active documents for statistics (exclude deactivated ones)
      let filteredDocuments = allDocuments.filter(doc => doc.status !== 'deactivated');

      console.log('[useDashboardAnalytics] Total documents:', filteredDocuments.length);
      console.log('[useDashboardAnalytics] Active filters:', filters);

      // Apply filters if provided
      if (filters) {
        if (filters.categories && filters.categories.length > 0) {
          filteredDocuments = filteredDocuments.filter(doc => 
            filters.categories!.includes(doc.category)
          );
          console.log('[useDashboardAnalytics] After category filter:', filteredDocuments.length);
        }
        
        if (filters.platforms && filters.platforms.length > 0) {
          filteredDocuments = filteredDocuments.filter(doc => {
            if (doc.type === 'certification') {
              return doc.platform && filters.platforms!.includes(doc.platform);
            }
            return true;
          });
          console.log('[useDashboardAnalytics] After platform filter:', filteredDocuments.length);
        }
        
        if (filters.statuses && filters.statuses.length > 0) {
          filteredDocuments = filteredDocuments.filter(doc => 
            filters.statuses!.includes(doc.status)
          );
          console.log('[useDashboardAnalytics] After status filter:', filteredDocuments.length);
        }
        
        if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          filteredDocuments = filteredDocuments.filter(doc => {
            const docDate = new Date(doc.created_at);
            return docDate >= startDate && docDate <= endDate;
          });
          console.log('[useDashboardAnalytics] After date filter:', filteredDocuments.length);
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

      // Helper function to calculate document status at a specific date
      // Uses dynamic alert days based on document type (default 60 days for most types)
      const calculateStatusAtDate = (expiryDate: string | null, referenceDate: Date, alertDays: number = 60): string => {
        if (!expiryDate) return 'valid'; // Documents without expiry date are always valid
        
        const expiry = parseISO(expiryDate);
        const alertDaysAfterReference = new Date(referenceDate.getTime() + alertDays * 24 * 60 * 60 * 1000);
        
        if (expiry < referenceDate) return 'expired';
        if (expiry <= alertDaysAfterReference) return 'expiring';
        return 'valid';
      };

      // Helper function to get expiry date from any document type
      const getExpiryDate = (doc: any): string | null => {
        return (doc as any).validity_date || (doc as any).expiry_date || null;
      };

      // Helper to get alert days based on document category
      const getAlertDaysForDoc = (doc: any): number => {
        // Badges use 30 days, others use 60 days by default
        if (doc.category === 'Badges') return 30;
        return 60;
      };

      // Generate monthly trend (last 6 months) - based on REAL historical status
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const targetDate = subMonths(new Date(), i);
        const monthName = format(targetDate, 'MMM/yy', { locale: ptBR });
        const endOfTargetMonth = endOfMonth(targetDate);
        
        // Check if this is the current month
        const isCurrentMonth = targetDate.getMonth() === currentMonth && 
                               targetDate.getFullYear() === currentYear;
        
        // Get all documents that existed up to this month (created before or during)
        const existingDocs = filteredDocuments.filter(doc => {
          const docDate = parseISO(doc.created_at);
          return docDate <= endOfTargetMonth;
        });

        let compliance: number;
        
        if (isCurrentMonth) {
          // For current month, use CURRENT compliance rate (not projected to end of month)
          // This matches what's shown in the dashboard stats
          const currentValid = existingDocs.filter(doc => doc.status === 'valid').length;
          const currentExpiring = existingDocs.filter(doc => doc.status === 'expiring').length;
          const currentCompliant = currentValid + currentExpiring;
          compliance = existingDocs.length > 0 ? Math.round((currentCompliant / existingDocs.length) * 100) : 0;
        } else {
          // For past months, calculate REAL status at the end of that month
          const monthValid = existingDocs.filter(doc => {
            const alertDays = getAlertDaysForDoc(doc);
            const statusAtDate = calculateStatusAtDate(getExpiryDate(doc), endOfTargetMonth, alertDays);
            return statusAtDate === 'valid';
          }).length;
          
          const monthExpiring = existingDocs.filter(doc => {
            const alertDays = getAlertDaysForDoc(doc);
            const statusAtDate = calculateStatusAtDate(getExpiryDate(doc), endOfTargetMonth, alertDays);
            return statusAtDate === 'expiring';
          }).length;
          
          const monthCompliant = monthValid + monthExpiring;
          compliance = existingDocs.length > 0 ? Math.round((monthCompliant / existingDocs.length) * 100) : 0;
        }
        
        monthlyTrend.push({
          month: monthName,
          total: existingDocs.length,
          compliance: compliance
        });
      }

      // Category breakdown - using filtered documents to respect all active filters
      const categoryBreakdown = [
        {
          category: 'Certificações',
          count: filteredDocuments.filter(doc => doc.category === 'Certificações').length,
          expired: filteredDocuments.filter(doc => doc.category === 'Certificações' && doc.status === 'expired').length,
          expiring: filteredDocuments.filter(doc => doc.category === 'Certificações' && doc.status === 'expiring').length,
          valid: filteredDocuments.filter(doc => doc.category === 'Certificações' && doc.status === 'valid').length
        },
        {
          category: 'Atestados',
          count: filteredDocuments.filter(doc => doc.category === 'Atestados').length,
          expired: filteredDocuments.filter(doc => doc.category === 'Atestados' && doc.status === 'expired').length,
          expiring: filteredDocuments.filter(doc => doc.category === 'Atestados' && doc.status === 'expiring').length,
          valid: filteredDocuments.filter(doc => doc.category === 'Atestados' && doc.status === 'valid').length
        },
        {
          category: 'Documentos',
          count: filteredDocuments.filter(doc => doc.category === 'Documentos').length,
          expired: filteredDocuments.filter(doc => doc.category === 'Documentos' && doc.status === 'expired').length,
          expiring: filteredDocuments.filter(doc => doc.category === 'Documentos' && doc.status === 'expiring').length,
          valid: filteredDocuments.filter(doc => doc.category === 'Documentos' && doc.status === 'valid').length
        },
        {
          category: 'Badges',
          count: filteredDocuments.filter(doc => doc.category === 'Badges').length,
          expired: filteredDocuments.filter(doc => doc.category === 'Badges' && doc.status === 'expired').length,
          expiring: filteredDocuments.filter(doc => doc.category === 'Badges' && doc.status === 'expiring').length,
          valid: filteredDocuments.filter(doc => doc.category === 'Badges' && doc.status === 'valid').length
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
