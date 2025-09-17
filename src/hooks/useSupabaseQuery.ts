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
  recent_uploads: number;
  completion_percentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'certification' | 'certificate' | 'document';
  title: string;
  user_name: string;
  created_at: string;
  status: 'valid' | 'expiring' | 'expired';
}

export interface ExpiringItem {
  id: string;
  title: string;
  user_name: string;
  expires_in_days: number;
  type: 'certification' | 'certificate' | 'document';
  status: 'expiring' | 'expired';
}

// Hook para estatísticas do dashboard
export function useDashboardStats() {
  const { user, userRole } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-stats', user?.id, userRole],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) throw new Error('User not authenticated');

      // Build queries based on user role
      let certQuery = supabase.from('certifications').select('status, validity_date');
      let attQuery = supabase.from('technical_attestations').select('status, validity_date');
      let docQuery = supabase.from('legal_documents').select('status, validity_date');

      // Apply role-based filtering: admin sees all, others see only their own
      if (userRole !== 'admin') {
        certQuery = certQuery.eq('user_id', user.id);
        attQuery = attQuery.eq('user_id', user.id);
        docQuery = docQuery.eq('user_id', user.id);
      }

      // Query paralela para todas as estatísticas
      const [certificationsResult, attestationsResult, documentsResult] = await Promise.all([
        certQuery,
        attQuery,
        docQuery
      ]);

      const certifications = certificationsResult.data || [];
      const attestations = attestationsResult.data || [];
      const documents = documentsResult.data || [];

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Calcular certificações vencendo (excluindo já vencidas)
      const expiringCertifications = certifications.filter(cert => {
        if (!cert.validity_date) return false;
        const validityDate = new Date(cert.validity_date);
        return validityDate <= thirtyDaysFromNow && validityDate > now;
      }).length;

      // Calcular atestados vencendo (excluindo já vencidos)
      const expiringAttestations = attestations.filter(att => {
        if (!att.validity_date) return false;
        const validityDate = new Date(att.validity_date);
        return validityDate <= thirtyDaysFromNow && validityDate > now;
      }).length;

      // Calcular documentos vencendo (excluindo já vencidos)
      const expiringDocuments = documents.filter(doc => {
        if (!doc.validity_date) return false;
        const validityDate = new Date(doc.validity_date);
        return validityDate <= thirtyDaysFromNow && validityDate > now;
      }).length;

      const totalDocuments = certifications.length + attestations.length + documents.length;
      const validDocuments = [...certifications, ...attestations, ...documents]
        .filter(item => item.status === 'valid').length;

      const completionPercentage = totalDocuments > 0 
        ? Math.round((validDocuments / totalDocuments) * 100) 
        : 0;

      return {
        total_certifications: certifications.length,
        expiring_certifications: expiringCertifications,
        total_certificates: attestations.length,
        expiring_certificates: expiringAttestations,
        total_documents: documents.length,
        expiring_documents: expiringDocuments,
        recent_uploads: 0, // Será implementado com auditoria
        completion_percentage: completionPercentage
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para atividade recente
export function useRecentActivity() {
  const { user, userRole } = useAuth();
  
  return useQuery({
    queryKey: ['recent-activity', user?.id, userRole],
    queryFn: async (): Promise<RecentActivity[]> => {
      if (!user) throw new Error('User not authenticated');

      // Build queries based on user role
      let certQuery = supabase
        .from('certifications')
        .select(`
          id,
          name,
          created_at,
          status,
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      let attQuery = supabase
        .from('technical_attestations')
        .select(`
          id,
          project_object,
          created_at,
          status,
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      let docQuery = supabase
        .from('legal_documents')
        .select(`
          id,
          document_name,
          created_at,
          status,
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Apply role-based filtering: admin sees all, others see only their own
      if (userRole !== 'admin') {
        certQuery = certQuery.eq('user_id', user.id);
        attQuery = attQuery.eq('user_id', user.id);
        docQuery = docQuery.eq('user_id', user.id);
      }

      // Buscar atividades recentes de diferentes tabelas
      const [certificationsResult, attestationsResult, documentsResult] = await Promise.all([
        certQuery,
        attQuery,
        docQuery
      ]);

      const activities: RecentActivity[] = [];

      // Processar certificações
      certificationsResult.data?.forEach(cert => {
        activities.push({
          id: cert.id,
          type: 'certification',
          title: cert.name,
          user_name: (cert.profiles as any).full_name,
          created_at: cert.created_at,
          status: cert.status as any
        });
      });

      // Processar atestados
      attestationsResult.data?.forEach(att => {
        activities.push({
          id: att.id,
          type: 'certificate',
          title: att.project_object,
          user_name: (att.profiles as any).full_name,
          created_at: att.created_at,
          status: att.status as any
        });
      });

      // Processar documentos
      documentsResult.data?.forEach(doc => {
        activities.push({
          id: doc.id,
          type: 'document',
          title: doc.document_name,
          user_name: (doc.profiles as any).full_name,
          created_at: doc.created_at,
          status: doc.status as any
        });
      });

      // Ordenar por data mais recente e limitar a 10
      return activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para itens vencendo
export function useExpiringItems() {
  const { user, userRole } = useAuth();
  
  return useQuery({
    queryKey: ['expiring-items', user?.id, userRole],
    queryFn: async (): Promise<ExpiringItem[]> => {
      if (!user) throw new Error('User not authenticated');

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Build queries based on user role
      let certQuery = supabase
        .from('certifications')
        .select(`
          id,
          name,
          validity_date,
          profiles!inner(full_name)
        `)
        .not('validity_date', 'is', null)
        .lte('validity_date', thirtyDaysFromNow.toISOString())
        .gt('validity_date', now.toISOString()); // Exclude already expired

      let attQuery = supabase
        .from('technical_attestations')
        .select(`
          id,
          project_object,
          validity_date,
          profiles!inner(full_name)
        `)
        .not('validity_date', 'is', null)
        .lte('validity_date', thirtyDaysFromNow.toISOString())
        .gt('validity_date', now.toISOString()); // Exclude already expired

      let docQuery = supabase
        .from('legal_documents')
        .select(`
          id,
          document_name,
          validity_date,
          profiles!inner(full_name)
        `)
        .not('validity_date', 'is', null)
        .lte('validity_date', thirtyDaysFromNow.toISOString())
        .gt('validity_date', now.toISOString()); // Exclude already expired

      // Apply role-based filtering: admin sees all, others see only their own
      if (userRole !== 'admin') {
        certQuery = certQuery.eq('user_id', user.id);
        attQuery = attQuery.eq('user_id', user.id);
        docQuery = docQuery.eq('user_id', user.id);
      }

      // Buscar itens vencendo nas próximas semanas
      const [certificationsResult, attestationsResult, documentsResult] = await Promise.all([
        certQuery,
        attQuery,
        docQuery
      ]);

      const expiringItems: ExpiringItem[] = [];

      // Processar certificações
      certificationsResult.data?.forEach(cert => {
        if (cert.validity_date) {
          const expiryDate = new Date(cert.validity_date);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          expiringItems.push({
            id: cert.id,
            title: cert.name,
            user_name: (cert.profiles as any).full_name,
            expires_in_days: daysUntilExpiry,
            type: 'certification',
            status: daysUntilExpiry <= 0 ? 'expired' : 'expiring'
          });
        }
      });

      // Processar atestados
      attestationsResult.data?.forEach(att => {
        if (att.validity_date) {
          const expiryDate = new Date(att.validity_date);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          expiringItems.push({
            id: att.id,
            title: att.project_object,
            user_name: (att.profiles as any).full_name,
            expires_in_days: daysUntilExpiry,
            type: 'certificate',
            status: daysUntilExpiry <= 0 ? 'expired' : 'expiring'
          });
        }
      });

      // Processar documentos
      documentsResult.data?.forEach(doc => {
        if (doc.validity_date) {
          const expiryDate = new Date(doc.validity_date);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          expiringItems.push({
            id: doc.id,
            title: doc.document_name,
            user_name: (doc.profiles as any).full_name,
            expires_in_days: daysUntilExpiry,
            type: 'document',
            status: daysUntilExpiry <= 0 ? 'expired' : 'expiring'
          });
        }
      });

      // Ordenar por data de vencimento mais próxima
      return expiringItems.sort((a, b) => a.expires_in_days - b.expires_in_days);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}