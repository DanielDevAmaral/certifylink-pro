import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CertificationSearchResult {
  id: string;
  name: string;
  function: string;
  user_id: string;
  creator_name?: string;
}

export function useCertificationSearch(searchTerm?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['certification-search', searchTerm],
    queryFn: async (): Promise<CertificationSearchResult[]> => {
      let query = supabase
        .from('certifications')
        .select(`
          id,
          name,
          function,
          user_id,
          profiles!certifications_user_id_fkey(full_name)
        `);

      // Filter by search term if provided
      if (searchTerm && searchTerm.trim().length > 0) {
        query = query.or(`name.ilike.%${searchTerm}%,function.ilike.%${searchTerm}%`);
      }

      // Order by name for consistent results
      query = query.order('name');

      const { data, error } = await query;

      if (error) {
        console.error('Error searching certifications:', error);
        throw error;
      }

      return (data || []).map(cert => ({
        id: cert.id,
        name: cert.name,
        function: cert.function,
        user_id: cert.user_id,
        creator_name: (cert.profiles as any)?.full_name
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}