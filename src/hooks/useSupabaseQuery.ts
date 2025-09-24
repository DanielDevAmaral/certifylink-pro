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
  expiring_alert: number;
}

export interface RecentActivity {
  id: string;
  type: 'certification' | 'technical_attestation' | 'legal_document' | 'badge';
  title: string;
  user_name: string;
  validity_date: string | null;
  status: 'valid' | 'expiring' | 'expired';
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
      if (!user) throw new Error('User not authenticated');

      // Build queries based on user role
      let certQuery = supabase.from('certifications').select('status, validity_date');
      let attQuery = supabase.from('technical_attestations').select('status, validity_date');
      let docQuery = supabase.from('legal_documents').select('status, validity_date');

      // All authenticated users can see all data (RLS handles access control)

      // Query paralela para todas as estatísticas
      const [certificationsResult, attestationsResult, documentsResult] = await Promise.all([
        certQuery,
        attQuery,
        docQuery
      ]);

      const certifications = certificationsResult.data || [];
      const attestations = attestationsResult.data || [];
      const documents = documentsResult.data || [];

      // Use database status field instead of dynamic calculation
      const expiringCertifications = certifications.filter(cert => cert.status === 'expiring').length;
      const expiringAttestations = attestations.filter(att => att.status === 'expiring').length;
      const expiringDocuments = documents.filter(doc => doc.status === 'expiring').length;

      const totalDocuments = certifications.length + attestations.length + documents.length;
      const validDocuments = [...certifications, ...attestations, ...documents]
        .filter(item => item.status === 'valid').length;
      const allExpiringDocuments = [...certifications, ...attestations, ...documents]
        .filter(item => item.status === 'expiring').length;
      
      // Conformidade inclui documentos válidos + vencendo (ainda não vencidos)
      const compliantDocuments = validDocuments + allExpiringDocuments;
      const completionPercentage = totalDocuments > 0 
        ? Math.round((compliantDocuments / totalDocuments) * 100) 
        : 0;

      return {
        total_certifications: certifications.length,
        expiring_certifications: expiringCertifications,
        total_certificates: attestations.length,
        expiring_certificates: expiringAttestations,
        total_documents: documents.length,
        expiring_documents: expiringDocuments,
        recent_uploads: 0, // Será implementado com auditoria
        completion_percentage: completionPercentage,
        expiring_alert: allExpiringDocuments // Total de documentos vencendo como alerta
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
          validity_date,
          status,
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
          profiles!left(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // All authenticated users can see all data (RLS handles access control)

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
            user_name: (cert.profiles as any)?.full_name || 'Usuário não encontrado',
          validity_date: cert.validity_date,
          status: cert.status as any
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
          status: att.status as any
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
          status: doc.status as any
        });
      });

      // Ordenar por data mais recente e limitar a 10
      return activities.slice(0, 10);
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
          status,
          profiles!left(full_name)
        `)
        .in('status', ['expiring', 'expired']);

      let attQuery = supabase
        .from('technical_attestations')
        .select(`
          id,
          project_object,
          validity_date,
          status,
          profiles!left(full_name)
        `)
        .in('status', ['expiring', 'expired']);

      let docQuery = supabase
        .from('legal_documents')
        .select(`
          id,
          document_name,
          validity_date,
          status,
          profiles!left(full_name)
        `)
        .in('status', ['expiring', 'expired']);

      // All authenticated users can see all data (RLS handles access control)

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
          const expiryDate = new Date(cert.validity_date + 'T00:00:00');
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          expiringItems.push({
            id: cert.id,
            title: cert.name,
            user_name: (cert.profiles as any)?.full_name || 'Usuário não encontrado',
            expires_in_days: daysUntilExpiry,
            type: 'certification',
            status: cert.status as 'expiring' | 'expired'
          });
        }
      });

      // Processar atestados
      attestationsResult.data?.forEach(att => {
        if (att.validity_date) {
          const expiryDate = new Date(att.validity_date + 'T00:00:00');
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          expiringItems.push({
            id: att.id,
            title: att.project_object,
            user_name: (att.profiles as any)?.full_name || 'Usuário não encontrado',
            expires_in_days: daysUntilExpiry,
            type: 'technical_attestation',
            status: att.status as 'expiring' | 'expired'
          });
        }
      });

      // Processar documentos
      documentsResult.data?.forEach(doc => {
        if (doc.validity_date) {
          const expiryDate = new Date(doc.validity_date + 'T00:00:00');
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          expiringItems.push({
            id: doc.id,
            title: doc.document_name,
            user_name: (doc.profiles as any)?.full_name || 'Usuário não encontrado',
            expires_in_days: daysUntilExpiry,
            type: 'legal_document',
            status: doc.status as 'expiring' | 'expired'
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