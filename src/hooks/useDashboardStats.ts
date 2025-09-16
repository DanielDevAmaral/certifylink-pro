import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  total_certifications: number;
  total_certificates: number;
  total_documents: number;
  expiring_certifications: number;
  expiring_certificates: number;
  expiring_documents: number;
  completion_percentage: number;
}

export function useDashboardStats() {
  const { user, userRole } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id, userRole],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) throw new Error('User not authenticated');

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Base query conditions based on user role
      let certQuery = supabase.from('certifications').select('*');
      let attQuery = supabase.from('technical_attestations').select('*');
      let docQuery = supabase.from('legal_documents').select('*');

      // Apply role-based filtering
      if (userRole === 'user') {
        certQuery = certQuery.eq('user_id', user.id);
        attQuery = attQuery.eq('user_id', user.id);
        docQuery = docQuery.eq('user_id', user.id);
      } else if (userRole === 'leader') {
        // Leaders can see their team's data - would need team relationship
        // For now, keeping simple and showing user's data
        certQuery = certQuery.eq('user_id', user.id);
        attQuery = attQuery.eq('user_id', user.id);
        docQuery = docQuery.eq('user_id', user.id);
      }
      // Admins see all data (no additional filtering)

      const [certResult, attResult, docResult] = await Promise.all([
        certQuery,
        attQuery,
        docQuery
      ]);

      const certifications = certResult.data || [];
      const attestations = attResult.data || [];
      const documents = docResult.data || [];

      const expiringCerts = certifications.filter(c => {
        if (!c.validity_date) return false;
        const validityDate = new Date(c.validity_date);
        return validityDate <= thirtyDaysFromNow && validityDate > now;
      }).length;

      const expiringAtts = attestations.filter(a => {
        if (!a.validity_date) return false;
        const validityDate = new Date(a.validity_date);
        return validityDate <= thirtyDaysFromNow && validityDate > now;
      }).length;

      const expiringDocs = documents.filter(d => {
        if (!d.validity_date) return false;
        const validityDate = new Date(d.validity_date);
        return validityDate <= thirtyDaysFromNow && validityDate > now;
      }).length;

      const totalDocs = certifications.length + attestations.length + documents.length;
      const validDocs = [
        ...certifications.filter(c => c.status === 'valid'),
        ...attestations.filter(a => a.status === 'valid'),
        ...documents.filter(d => d.status === 'valid')
      ].length;

      const completion_percentage = totalDocs > 0 ? Math.round((validDocs / totalDocs) * 100) : 0;

      return {
        total_certifications: certifications.length,
        total_certificates: attestations.length,
        total_documents: documents.length,
        expiring_certifications: expiringCerts,
        expiring_certificates: expiringAtts,
        expiring_documents: expiringDocs,
        completion_percentage,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
