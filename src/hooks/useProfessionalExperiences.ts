import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProfessionalExperience } from '@/types/knowledge';

export function useProfessionalExperiences(userId?: string) {
  const queryClient = useQueryClient();

  const { data: experiences, isLoading, error } = useQuery({
    queryKey: ['professional-experiences', userId],
    queryFn: async () => {
      let query = supabase
        .from('professional_experiences')
        .select('*')
        .order('start_date', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProfessionalExperience[];
    },
    enabled: !!userId,
  });

  const createExperience = useMutation({
    mutationFn: async (experience: Omit<ProfessionalExperience, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('professional_experiences')
        .insert(experience)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-experiences'] });
      toast.success('Experiência profissional cadastrada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating experience:', error);
      toast.error('Erro ao cadastrar experiência profissional');
    },
  });

  const updateExperience = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProfessionalExperience> & { id: string }) => {
      const { data, error } = await supabase
        .from('professional_experiences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-experiences'] });
      toast.success('Experiência profissional atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error updating experience:', error);
      toast.error('Erro ao atualizar experiência profissional');
    },
  });

  const deleteExperience = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('professional_experiences')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-experiences'] });
      toast.success('Experiência profissional removida com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting experience:', error);
      toast.error('Erro ao remover experiência profissional');
    },
  });

  return {
    experiences,
    isLoading,
    error,
    createExperience: createExperience.mutateAsync,
    updateExperience: updateExperience.mutateAsync,
    deleteExperience: deleteExperience.mutateAsync,
    isCreating: createExperience.isPending,
    isUpdating: updateExperience.isPending,
    isDeleting: deleteExperience.isPending,
  };
}
