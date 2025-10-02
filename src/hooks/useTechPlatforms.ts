import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TechPlatform } from '@/types';
import { toast } from 'sonner';

export const useTechPlatforms = () => {
  return useQuery({
    queryKey: ['tech-platforms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tech_platforms')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as TechPlatform[];
    },
  });
};

export const useCreateTechPlatform = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platform: Omit<TechPlatform, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tech_platforms')
        .insert(platform)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-platforms'] });
      toast.success('Plataforma criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar plataforma: ${error.message}`);
    },
  });
};

export const useUpdateTechPlatform = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TechPlatform> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('tech_platforms')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-platforms'] });
      toast.success('Plataforma atualizada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar plataforma: ${error.message}`);
    },
  });
};

export const useDeleteTechPlatform = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tech_platforms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-platforms'] });
      toast.success('Plataforma excluída com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir plataforma: ${error.message}`);
    },
  });
};
