import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CertificationPlatform {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export function useCertificationPlatforms() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['certification-platforms'],
    queryFn: async (): Promise<CertificationPlatform[]> => {
      const { data, error } = await supabase
        .from('certification_platforms')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching certification platforms:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateCertificationPlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platform: Omit<CertificationPlatform, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('certification_platforms')
        .insert(platform)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-platforms'] });
      toast.success('Plataforma criada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating platform:', error);
      toast.error('Erro ao criar plataforma');
    },
  });
}

export function useUpdateCertificationPlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CertificationPlatform> & { id: string }) => {
      const { data, error } = await supabase
        .from('certification_platforms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-platforms'] });
      toast.success('Plataforma atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error updating platform:', error);
      toast.error('Erro ao atualizar plataforma');
    },
  });
}

export function useDeleteCertificationPlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('certification_platforms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-platforms'] });
      toast.success('Plataforma removida com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting platform:', error);
      toast.error('Erro ao remover plataforma');
    },
  });
}