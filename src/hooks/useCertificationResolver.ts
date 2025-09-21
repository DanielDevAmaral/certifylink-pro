import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ResolvedCertification {
  id: string;
  name: string;
  function: string;
}

export function useCertificationResolver(certificationIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['certifications-resolver', certificationIds.sort()],
    queryFn: async (): Promise<ResolvedCertification[]> => {
      if (!certificationIds.length) return [];

      // Filter out non-UUID values (old text-based certifications)
      const validUUIDs = certificationIds.filter(id => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      );

      if (!validUUIDs.length) return [];

      const { data, error } = await supabase
        .from('certifications')
        .select('id, name, function')
        .in('id', validUUIDs);

      if (error) {
        console.error('Error resolving certifications:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user && certificationIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCertificationNames(certificationIds: string[]) {
  const { data: certifications = [] } = useCertificationResolver(certificationIds);
  
  return certificationIds.map(id => {
    // If it's a valid UUID, try to find the certification
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      const certification = certifications.find(cert => cert.id === id);
      return certification ? `${certification.name} - ${certification.function}` : `Certificação não encontrada (${id.slice(0, 8)}...)`;
    }
    // If it's not a UUID, it's probably old text data
    return id;
  });
}