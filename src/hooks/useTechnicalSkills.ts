import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TechnicalSkill, SkillCategory } from '@/types/knowledge';

export function useTechnicalSkills(category?: SkillCategory) {
  const queryClient = useQueryClient();

  const { data: skills, isLoading, error } = useQuery({
    queryKey: ['technical-skills', category],
    queryFn: async () => {
      let query = supabase
        .from('technical_skills')
        .select(`
          *,
          user_skills(count)
        `)
        .order('name');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform data to include user count
      return (data || []).map(skill => ({
        ...skill,
        user_count: Array.isArray(skill.user_skills) ? skill.user_skills.length : 0
      })) as any[];
    },
  });

  const createSkill = useMutation({
    mutationFn: async (skill: Omit<TechnicalSkill, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('technical_skills')
        .insert(skill)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-skills'] });
      toast.success('Competência técnica cadastrada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating skill:', error);
      toast.error('Erro ao cadastrar competência técnica');
    },
  });

  const updateSkill = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TechnicalSkill> & { id: string }) => {
      const { data, error } = await supabase
        .from('technical_skills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-skills'] });
      toast.success('Competência técnica atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error updating skill:', error);
      toast.error('Erro ao atualizar competência técnica');
    },
  });

  const deleteSkill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('technical_skills')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-skills'] });
      toast.success('Competência técnica removida com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting skill:', error);
      toast.error('Erro ao remover competência técnica');
    },
  });

  return {
    skills,
    isLoading,
    error,
    createSkill: createSkill.mutateAsync,
    updateSkill: updateSkill.mutateAsync,
    deleteSkill: deleteSkill.mutateAsync,
    isCreating: createSkill.isPending,
    isUpdating: updateSkill.isPending,
    isDeleting: deleteSkill.isPending,
  };
}
