import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AcademicEducation } from '@/types/knowledge';

export function useAcademicEducation(userId?: string) {
  const queryClient = useQueryClient();

  const { data: educations, isLoading, error } = useQuery({
    queryKey: ['academic-education', userId],
    queryFn: async () => {
      let query = supabase
        .from('academic_education')
        .select('*')
        .order('start_date', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AcademicEducation[];
    },
    enabled: !!userId,
  });

  const createEducation = useMutation({
    mutationFn: async (education: Omit<AcademicEducation, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('academic_education')
        .insert(education)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-education'] });
      toast.success('Formação acadêmica cadastrada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating education:', error);
      toast.error('Erro ao cadastrar formação acadêmica');
    },
  });

  const updateEducation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AcademicEducation> & { id: string }) => {
      const { data, error } = await supabase
        .from('academic_education')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-education'] });
      toast.success('Formação acadêmica atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error updating education:', error);
      toast.error('Erro ao atualizar formação acadêmica');
    },
  });

  const deleteEducation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('academic_education')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-education'] });
      toast.success('Formação acadêmica removida com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting education:', error);
      toast.error('Erro ao remover formação acadêmica');
    },
  });

  return {
    educations,
    isLoading,
    error,
    createEducation: createEducation.mutateAsync,
    updateEducation: updateEducation.mutateAsync,
    deleteEducation: deleteEducation.mutateAsync,
    isCreating: createEducation.isPending,
    isUpdating: updateEducation.isPending,
    isDeleting: deleteEducation.isPending,
  };
}
