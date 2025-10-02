import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BusinessVertical } from '@/types';
import { toast } from 'sonner';

export const useBusinessVerticals = () => {
  return useQuery({
    queryKey: ['business-verticals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_verticals')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as BusinessVertical[];
    },
  });
};

export const useCreateBusinessVertical = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vertical: Omit<BusinessVertical, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('business_verticals')
        .insert(vertical)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-verticals'] });
      toast.success('Vertical de negócio criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar vertical: ${error.message}`);
    },
  });
};

export const useUpdateBusinessVertical = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<BusinessVertical> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('business_verticals')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-verticals'] });
      toast.success('Vertical de negócio atualizada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar vertical: ${error.message}`);
    },
  });
};

export const useDeleteBusinessVertical = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_verticals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-verticals'] });
      toast.success('Vertical de negócio excluída com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir vertical: ${error.message}`);
    },
  });
};
