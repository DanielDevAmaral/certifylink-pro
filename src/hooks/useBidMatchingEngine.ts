import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BidRequirementMatch, BidRequirement, ScoreBreakdown } from '@/types/knowledge';

export function useBidMatchingEngine(requirementId?: string) {
  const queryClient = useQueryClient();

  const { data: matches, isLoading, error } = useQuery({
    queryKey: ['bid-matches', requirementId],
    queryFn: async () => {
      let query = supabase
        .from('bid_requirement_matches')
        .select('*')
        .order('match_score', { ascending: false });

      if (requirementId) {
        query = query.eq('requirement_id', requirementId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch related data separately
      const matchesWithDetails = await Promise.all((data || []).map(async (match) => {
        const [requirement, profile] = await Promise.all([
          supabase.from('bid_requirements').select('*').eq('id', match.requirement_id).single(),
          supabase.from('profiles').select('full_name, email, position').eq('user_id', match.user_id).single()
        ]);
        
        return {
          ...match,
          score_breakdown: match.score_breakdown as unknown as ScoreBreakdown,
          requirement: requirement.data,
          user_profile: profile.data,
        };
      }));
      
      return matchesWithDetails as BidRequirementMatch[];
    },
  });

  const calculateMatch = useMutation({
    mutationFn: async (params: { requirementId: string }) => {
      // Get requirement details
      const { data: requirement, error: reqError } = await supabase
        .from('bid_requirements')
        .select('*')
        .eq('id', params.requirementId)
        .single();

      if (reqError) throw reqError;

      // Get all active users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('status', 'active');

      if (usersError) throw usersError;
      if (!users || users.length === 0) {
        throw new Error('Nenhum usuário ativo encontrado');
      }

      const matchesToInsert = [];

      // Calculate match for each user
      for (const user of users) {
        // Get user's education
        const { data: educations } = await supabase
          .from('academic_education')
          .select('*')
          .eq('user_id', user.user_id);

        // Get user's experiences
        const { data: experiences } = await supabase
          .from('professional_experiences')
          .select('*')
          .eq('user_id', user.user_id);

        // Get user's skills
        const { data: userSkills } = await supabase
          .from('user_skills')
          .select('*, technical_skill:technical_skills(*)')
          .eq('user_id', user.user_id);

        // Get user's certifications
        const { data: certifications } = await supabase
          .from('certifications')
          .select('*')
          .eq('user_id', user.user_id);

        // Calculate score
        const scoreBreakdown = calculateScore(requirement, {
          educations: educations || [],
          experiences: experiences || [],
          userSkills: userSkills || [],
          certifications: certifications || [],
        });

        const totalScore = Object.values(scoreBreakdown).reduce((sum, val) => sum + val, 0);

        // Only add matches with score > 0
        if (totalScore > 0) {
          matchesToInsert.push({
            requirement_id: params.requirementId,
            user_id: user.user_id,
            match_score: totalScore,
            score_breakdown: scoreBreakdown as any,
            status: 'pending_validation' as const,
          });
        }
      }

      // Batch insert all matches
      if (matchesToInsert.length > 0) {
        const { error } = await supabase
          .from('bid_requirement_matches')
          .upsert(matchesToInsert);

        if (error) throw error;
      }

      return { 
        totalUsers: users.length, 
        matchesFound: matchesToInsert.length 
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bid-matches'] });
      toast.success(`${data.matchesFound} profissionais adequados encontrados de ${data.totalUsers} analisados`);
    },
    onError: (error) => {
      console.error('Error calculating match:', error);
      toast.error('Erro ao calcular match');
    },
  });

  const validateMatch = useMutation({
    mutationFn: async (params: { 
      matchId: string; 
      status: 'validated' | 'rejected'; 
      notes?: string;
      validatedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('bid_requirement_matches')
        .update({
          status: params.status,
          validated_by: params.validatedBy,
          validated_at: new Date().toISOString(),
          validation_notes: params.notes,
        })
        .eq('id', params.matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-matches'] });
      toast.success('Match validado com sucesso');
    },
    onError: (error) => {
      console.error('Error validating match:', error);
      toast.error('Erro ao validar match');
    },
  });

  return {
    matches,
    isLoading,
    error,
    calculateMatch: calculateMatch.mutateAsync,
    validateMatch: validateMatch.mutateAsync,
    isCalculating: calculateMatch.isPending,
    isValidating: validateMatch.isPending,
  };
}

function calculateScore(
  requirement: BidRequirement,
  userData: {
    educations: any[];
    experiences: any[];
    userSkills: any[];
    certifications: any[];
  }
): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    education_match: 0,
    experience_years_match: 0,
    skills_match: 0,
    certifications_match: 0,
  };

  // 1. Education Match (25 points)
  const hasMatchingEducation = userData.educations.some(
    (edu) =>
      requirement.required_fields_of_study?.some((field) =>
        edu.field_of_study?.toLowerCase().includes(field.toLowerCase())
      ) &&
      requirement.required_education_levels?.includes(edu.education_level)
  );
  breakdown.education_match = hasMatchingEducation ? 25 : 0;

  // 2. Experience Years Match (30 points)
  const totalYears = calculateTotalExperience(userData.experiences);
  if (totalYears >= requirement.required_experience_years) {
    breakdown.experience_years_match = 30;
  } else {
    breakdown.experience_years_match = Math.round(
      (totalYears / requirement.required_experience_years) * 30
    );
  }

  // 3. Skills Match (30 points)
  if (requirement.required_skills && requirement.required_skills.length > 0) {
    const matchedSkills = userData.userSkills.filter((us) =>
      requirement.required_skills?.includes(us.skill_id)
    );
    const skillsPercentage = matchedSkills.length / requirement.required_skills.length;
    breakdown.skills_match = Math.round(skillsPercentage * 30);
  }

  // 4. Certifications Match (15 points)
  if (requirement.required_certifications && requirement.required_certifications.length > 0) {
    const matchedCerts = userData.certifications.filter((cert) =>
      requirement.required_certifications?.some((reqCert) =>
        cert.name.toLowerCase().includes(reqCert.toLowerCase())
      )
    );
    const certsPercentage = matchedCerts.length / requirement.required_certifications.length;
    breakdown.certifications_match = Math.round(certsPercentage * 15);
  }

  return breakdown;
}

function calculateTotalExperience(experiences: any[]): number {
  let totalMonths = 0;

  experiences.forEach((exp) => {
    const startDate = new Date(exp.start_date);
    const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
    
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                   (endDate.getMonth() - startDate.getMonth());
    
    totalMonths += months;
  });

  return Math.round(totalMonths / 12);
}
