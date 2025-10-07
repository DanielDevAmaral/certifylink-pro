import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserSkill } from '@/types/knowledge';

export function useUserSkills(userId?: string) {
  const queryClient = useQueryClient();

  const { data: userSkills, isLoading, error } = useQuery({
    queryKey: ['user-skills', userId],
    queryFn: async () => {
      let query = supabase
        .from('user_skills')
        .select(`
          *,
          technical_skill:technical_skills(*)
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserSkill[];
    },
    enabled: !!userId,
  });

  const addSkill = useMutation({
    mutationFn: async (userSkill: Omit<UserSkill, 'id' | 'created_at' | 'updated_at' | 'technical_skill'>) => {
      const { data, error } = await supabase
        .from('user_skills')
        .insert(userSkill)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills'] });
      toast.success('Competência adicionada com sucesso');
    },
    onError: (error) => {
      console.error('Error adding skill:', error);
      toast.error('Erro ao adicionar competência');
    },
  });

  const updateSkill = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserSkill> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_skills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills'] });
      toast.success('Competência atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error updating skill:', error);
      toast.error('Erro ao atualizar competência');
    },
  });

  const removeSkill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills'] });
      toast.success('Competência removida com sucesso');
    },
    onError: (error) => {
      console.error('Error removing skill:', error);
      toast.error('Erro ao remover competência');
    },
  });

  return {
    userSkills,
    isLoading,
    error,
    addSkill: addSkill.mutateAsync,
    updateSkill: updateSkill.mutateAsync,
    removeSkill: removeSkill.mutateAsync,
    isAdding: addSkill.isPending,
    isUpdating: updateSkill.isPending,
    isRemoving: removeSkill.isPending,
  };
}
