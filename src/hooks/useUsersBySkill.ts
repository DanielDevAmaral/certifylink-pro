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

      // Step 1: Fetch user_skills
      const { data: userSkills, error: skillsError } = await supabase
        .from('user_skills')
        .select('user_id, proficiency_level, years_of_experience')
        .eq('skill_id', skillId)
        .order('years_of_experience', { ascending: false });

      if (skillsError) {
        console.error('❌ [useUsersBySkill] Error fetching user_skills:', skillsError);
        throw skillsError;
      }

      if (!userSkills || userSkills.length === 0) {
        console.log('ℹ️ [useUsersBySkill] No user_skills found for this skill');
        return [];
      }

      console.log('📊 [useUsersBySkill] Found', userSkills.length, 'user_skills records');

      // Step 2: Fetch profiles for these users
      const userIds = userSkills.map(us => us.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, position, department, status')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('❌ [useUsersBySkill] Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('📊 [useUsersBySkill] Found', profiles?.length || 0, 'profiles');

      // Step 3: Combine data client-side
      const combined = userSkills
        .map((skillData, index) => {
          const profile = profiles?.find(p => p.user_id === skillData.user_id);
          
          if (!profile) {
            console.warn(`⚠️ [useUsersBySkill] Record ${index}: No profile found for user_id ${skillData.user_id}`);
            return null;
          }
          
          if (!profile.full_name) {
            console.warn(`⚠️ [useUsersBySkill] Record ${index}: Profile missing full_name for user_id ${skillData.user_id}`);
            return null;
          }

          if (profile.status !== 'active') {
            console.log(`ℹ️ [useUsersBySkill] Record ${index}: User ${profile.full_name} has status: ${profile.status}`);
            return null;
          }

          return {
            user_id: skillData.user_id,
            full_name: profile.full_name,
            email: profile.email,
            position: profile.position,
            department: profile.department,
            proficiency_level: skillData.proficiency_level as string,
            years_of_experience: skillData.years_of_experience || 0,
          } as UserSkillDetail;
        })
        .filter((item): item is UserSkillDetail => item !== null);

      console.log('✅ [useUsersBySkill] Final filtered results:', combined.length, 'active professionals');
      
      return combined;
    },
    enabled: !!skillId,
  });
}
