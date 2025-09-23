import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CertificationCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export function useCertificationCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['certification-categories'],
    queryFn: async (): Promise<CertificationCategory[]> => {
      const { data, error } = await supabase
        .from('certification_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching certification categories:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateCertificationCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<CertificationCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('certification_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-categories'] });
      toast.success('Categoria criada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast.error('Erro ao criar categoria');
    },
  });
}

export function useUpdateCertificationCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CertificationCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('certification_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-categories'] });
      toast.success('Categoria atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast.error('Erro ao atualizar categoria');
    },
  });
}

export function useDeleteCertificationCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('certification_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-categories'] });
      toast.success('Categoria removida com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
      toast.error('Erro ao remover categoria');
    },
  });
}