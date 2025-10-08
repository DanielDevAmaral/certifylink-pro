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
      if (!skillId) {
        console.log('🔍 [useUsersBySkill] No skillId provided');
        return [];
      }

      console.log('🔍 [useUsersBySkill] Fetching users for skill:', skillId);

      const { data, error } = await supabase
        .from('user_skills')
        .select(`
          user_id,
          proficiency_level,
          years_of_experience,
          profiles(
            full_name,
            email,
            position,
            department,
            status
          )
        `)
        .eq('skill_id', skillId)
        .order('years_of_experience', { ascending: false });

      if (error) {
        console.error('❌ [useUsersBySkill] Error fetching users:', error);
        throw error;
      }

      console.log('📊 [useUsersBySkill] Raw data received:', data?.length, 'records');

      // Filter and transform data
      const filteredData = (data || [])
        .map((item, index) => {
          const profile = item.profiles as any;
          
          // Debug log for each record
          if (!profile) {
            console.warn(`⚠️ [useUsersBySkill] Record ${index}: No profile found for user_id ${item.user_id}`);
            return null;
          }
          
          if (!profile.full_name) {
            console.warn(`⚠️ [useUsersBySkill] Record ${index}: Profile missing full_name for user_id ${item.user_id}`);
            return null;
          }

          if (profile.status !== 'active') {
            console.log(`ℹ️ [useUsersBySkill] Record ${index}: User ${profile.full_name} has status: ${profile.status}`);
            return null;
          }

          return {
            user_id: item.user_id,
            full_name: profile.full_name,
            email: profile.email,
            position: profile.position,
            department: profile.department,
            proficiency_level: item.proficiency_level as string,
            years_of_experience: item.years_of_experience || 0,
          } as UserSkillDetail;
        })
        .filter((item): item is UserSkillDetail => item !== null);

      console.log('✅ [useUsersBySkill] Filtered results:', filteredData.length, 'professionals');
      
      return filteredData;
    },
    enabled: !!skillId,
  });
}
