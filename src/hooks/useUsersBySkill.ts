import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserSkillDetail {
  user_id: string;
  full_name: string;
  email: string;
  position: string | null;
  department: string | null;
  proficiency_level: string;
  years_of_experience: number;
}

export function useUsersBySkill(skillId: string | null) {
  return useQuery({
    queryKey: ['users-by-skill', skillId],
    queryFn: async () => {
      if (!skillId) return [];

      const { data, error } = await supabase
        .from('user_skills')
        .select(`
          user_id,
          proficiency_level,
          years_of_experience,
          profiles!inner(
            full_name,
            email,
            position,
            department
          )
        `)
        .eq('skill_id', skillId)
        .order('years_of_experience', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        user_id: item.user_id,
        full_name: (item.profiles as any).full_name,
        email: (item.profiles as any).email,
        position: (item.profiles as any).position,
        department: (item.profiles as any).department,
        proficiency_level: item.proficiency_level,
        years_of_experience: item.years_of_experience || 0,
      })) as UserSkillDetail[];
    },
    enabled: !!skillId,
  });
}
