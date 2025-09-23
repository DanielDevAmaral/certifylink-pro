import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CertificationType {
  id: string;
  platform_id: string;
  category_id?: string;
  name: string;
  full_name: string;
  function?: string;
  aliases?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  platform?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

export function useCertificationTypes(platformId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['certification-types', platformId],
    queryFn: async (): Promise<CertificationType[]> => {
      let query = supabase
        .from('certification_types')
        .select(`
          *,
          platform:certification_platforms(id, name),
          category:certification_categories(id, name)
        `)
        .eq('is_active', true)
        .order('name');

      if (platformId) {
        query = query.eq('platform_id', platformId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching certification types:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCertificationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (certificationType: Omit<CertificationType, 'id' | 'created_at' | 'updated_at' | 'platform' | 'category'>) => {
      const { data, error } = await supabase
        .from('certification_types')
        .insert(certificationType)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-types'] });
      toast.success('Tipo de certificação criado com sucesso');
    },
    onError: (error) => {
      console.error('Error creating certification type:', error);
      toast.error('Erro ao criar tipo de certificação');
    },
  });
}

export function useUpdateCertificationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CertificationType> & { id: string }) => {
      const { data, error } = await supabase
        .from('certification_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-types'] });
      toast.success('Tipo de certificação atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating certification type:', error);
      toast.error('Erro ao atualizar tipo de certificação');
    },
  });
}

export function useDeleteCertificationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('certification_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-types'] });
      toast.success('Tipo de certificação removido com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting certification type:', error);
      toast.error('Erro ao remover tipo de certificação');
    },
  });
}

// Hook para busca inteligente de certificações por nome/alias
export function useSearchCertificationTypes(searchTerm: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['search-certification-types', searchTerm],
    queryFn: async (): Promise<CertificationType[]> => {
      if (!searchTerm || searchTerm.trim().length < 2) return [];

      const { data, error } = await supabase
        .from('certification_types')
        .select(`
          *,
          platform:certification_platforms(id, name),
          category:certification_categories(id, name)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,aliases.cs.{${searchTerm}}`)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Error searching certification types:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user && searchTerm.trim().length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}