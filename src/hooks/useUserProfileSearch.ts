import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileSearchFilters {
  searchTerm?: string;
  skillIds?: string[];
  educationLevels?: string[];
  certificationIds?: string[];
  minExperience?: number;
  maxExperience?: number;
  statuses?: string[];
  departments?: string[];
}

interface ProfileSearchResult {
  user_id: string;
  full_name: string;
  email: string;
  position?: string;
  department?: string;
  status: string;
  total_skills: number;
  total_certifications: number;
  highest_education_level?: string;
  max_skill_experience?: number;
  top_skills: Array<{ skill_id: string; name: string; proficiency_level: string }>;
  avatar_url?: string;
}

export function useUserProfileSearch(filters: ProfileSearchFilters) {
  return useQuery({
    queryKey: ['user-profile-search', filters],
    queryFn: async (): Promise<ProfileSearchResult[]> => {
      // 1. Build base profiles query
      let profilesQuery = supabase
        .from('profiles')
        .select('user_id, full_name, email, position, department, status, avatar_url');

      // Apply text search filter
      if (filters.searchTerm && filters.searchTerm.trim()) {
        profilesQuery = profilesQuery.or(
          `full_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,position.ilike.%${filters.searchTerm}%`
        );
      }

      // Apply status filter
      if (filters.statuses && filters.statuses.length > 0) {
        profilesQuery = profilesQuery.in('status', filters.statuses);
      } else {
        // Default: only active users
        profilesQuery = profilesQuery.eq('status', 'active');
      }

      // Apply department filter
      if (filters.departments && filters.departments.length > 0) {
        profilesQuery = profilesQuery.in('department', filters.departments);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map(p => p.user_id);

      // 2. Get user skills for all users
      const { data: userSkills } = await supabase
        .from('user_skills')
        .select(`
          user_id,
          skill_id,
          years_of_experience,
          proficiency_level,
          technical_skills!inner(name)
        `)
        .in('user_id', userIds);

      // 3. Get education data
      const { data: educations } = await supabase
        .from('academic_education')
        .select('user_id, education_level')
        .in('user_id', userIds)
        .eq('status', 'completed');

      // 4. Get certifications count
      const { data: certifications } = await supabase
        .from('certifications')
        .select('user_id, id')
        .in('user_id', userIds)
        .neq('status', 'deactivated');

      // 5. Process and filter results
      const results: ProfileSearchResult[] = profiles.map(profile => {
        const skills = userSkills?.filter(s => s.user_id === profile.user_id) || [];
        const userEducations = educations?.filter(e => e.user_id === profile.user_id) || [];
        const userCerts = certifications?.filter(c => c.user_id === profile.user_id) || [];

        // Calculate max experience from skills
        const maxSkillExperience = skills.length > 0 
          ? Math.max(...skills.map(s => Number(s.years_of_experience) || 0))
          : 0;

        // Get highest education level (order: doctorate > masters > bachelors > technician > high_school)
        const educationOrder = ['doctorate', 'masters', 'bachelors', 'technician', 'high_school'];
        const highestEducation = userEducations.length > 0
          ? educationOrder.find(level => userEducations.some(e => e.education_level === level))
          : undefined;

        // Get top 3 skills
        const topSkills = skills
          .sort((a, b) => {
            const expDiff = Number(b.years_of_experience || 0) - Number(a.years_of_experience || 0);
            if (expDiff !== 0) return expDiff;
            
            const proficiencyOrder = { advanced: 3, intermediate: 2, basic: 1 };
            return (proficiencyOrder[b.proficiency_level as keyof typeof proficiencyOrder] || 0) - 
                   (proficiencyOrder[a.proficiency_level as keyof typeof proficiencyOrder] || 0);
          })
          .slice(0, 3)
          .map(s => ({
            skill_id: s.skill_id,
            name: (s.technical_skills as any)?.name || '',
            proficiency_level: s.proficiency_level
          }));

        return {
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email,
          position: profile.position,
          department: profile.department,
          status: profile.status,
          total_skills: skills.length,
          total_certifications: userCerts.length,
          highest_education_level: highestEducation,
          max_skill_experience: maxSkillExperience,
          top_skills: topSkills,
          avatar_url: profile.avatar_url,
        };
      });

      // Apply advanced filters
      let filteredResults = results;

      // Filter by skills
      if (filters.skillIds && filters.skillIds.length > 0) {
        filteredResults = filteredResults.filter(result => {
          const userSkillIds = userSkills
            ?.filter(s => s.user_id === result.user_id)
            .map(s => s.skill_id) || [];
          return filters.skillIds!.every(skillId => userSkillIds.includes(skillId));
        });
      }

      // Filter by education levels
      if (filters.educationLevels && filters.educationLevels.length > 0) {
        filteredResults = filteredResults.filter(result => 
          result.highest_education_level && 
          filters.educationLevels!.includes(result.highest_education_level)
        );
      }

      // Filter by experience range
      if (filters.minExperience !== undefined) {
        filteredResults = filteredResults.filter(result => 
          (result.max_skill_experience || 0) >= filters.minExperience!
        );
      }

      if (filters.maxExperience !== undefined) {
        filteredResults = filteredResults.filter(result => 
          (result.max_skill_experience || 0) <= filters.maxExperience!
        );
      }

      // Filter by certifications
      if (filters.certificationIds && filters.certificationIds.length > 0) {
        filteredResults = filteredResults.filter(result => {
          const userCertIds = certifications
            ?.filter(c => c.user_id === result.user_id)
            .map(c => c.id) || [];
          return filters.certificationIds!.some(certId => userCertIds.includes(certId));
        });
      }

      // Sort by name
      return filteredResults.sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
    enabled: true,
  });
}
