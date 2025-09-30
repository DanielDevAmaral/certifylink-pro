import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RelatedCertification {
  certification_id: string;
  user_id: string;
}

export interface ResolvedRelatedCertification {
  certification_id: string;
  user_id: string;
  certification_name: string;
  certification_function: string;
  user_name: string;
}

export function useRelatedCertificationResolver(relatedCerts: RelatedCertification[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['related-certifications-resolver', relatedCerts],
    queryFn: async (): Promise<ResolvedRelatedCertification[]> => {
      if (!relatedCerts.length) return [];

      const certIds = relatedCerts.map(rc => rc.certification_id).filter(id => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      );
      const userIds = relatedCerts.map(rc => rc.user_id).filter(id => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      );

      if (!certIds.length || !userIds.length) return [];

      // Fetch certifications
      const { data: certifications, error: certError } = await supabase
        .from('certifications')
        .select('id, name, function')
        .in('id', certIds);

      if (certError) {
        console.error('Error resolving certifications:', certError);
        throw certError;
      }

      // Fetch user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profileError) {
        console.error('Error resolving profiles:', profileError);
        throw profileError;
      }

      // Map results
      return relatedCerts.map(rc => {
        const cert = certifications?.find(c => c.id === rc.certification_id);
        const profile = profiles?.find(p => p.user_id === rc.user_id);
        
        return {
          certification_id: rc.certification_id,
          user_id: rc.user_id,
          certification_name: cert?.name || 'Certificação não encontrada',
          certification_function: cert?.function || '',
          user_name: profile?.full_name || 'Usuário não encontrado'
        };
      });
    },
    enabled: !!user && relatedCerts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
