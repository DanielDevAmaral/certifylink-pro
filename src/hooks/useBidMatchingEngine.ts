import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BidRequirementMatch, BidRequirement, ScoreBreakdown } from '@/types/knowledge';

export function useBidMatchingEngine(bidId?: string) {
  const queryClient = useQueryClient();
  const [calculationProgress, setCalculationProgress] = useState<{ current: number; total: number } | null>(null);

  const { data: matchesByBid, isLoading, error } = useQuery({
    queryKey: ['bid-matches-by-bid', bidId],
    queryFn: async () => {
      if (!bidId) return [];

      // Get all requirements for this bid
      const { data: requirements, error: reqError } = await supabase
        .from('bid_requirements')
        .select('*, bid:bids(*)')
        .eq('bid_id', bidId)
        .order('role_title');

      if (reqError) throw reqError;
      if (!requirements || requirements.length === 0) return [];

      // Get matches for all requirements
      const requirementIds = requirements.map(r => r.id);
      const { data: matches, error: matchError } = await supabase
        .from('bid_requirement_matches')
        .select('*')
        .in('requirement_id', requirementIds)
        .order('match_score', { ascending: false });

      if (matchError) throw matchError;

      // Fetch user profiles for all matches
      const userIds = [...new Set(matches?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, position')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Group matches by requirement
      const grouped = requirements.map(req => {
        const reqMatches = (matches || [])
          .filter(m => m.requirement_id === req.id)
          .map(m => ({
            ...m,
            score_breakdown: m.score_breakdown as unknown as ScoreBreakdown,
            requirement: req,
            user_profile: profileMap.get(m.user_id),
          }));

        return {
          requirement: req as BidRequirement,
          matches: reqMatches as BidRequirementMatch[],
        };
      });

      return grouped;
    },
    enabled: !!bidId,
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

  const checkExistingMatches = async (bidId: string): Promise<boolean> => {
    const { data: requirements } = await supabase
      .from('bid_requirements')
      .select('id')
      .eq('bid_id', bidId);

    if (!requirements || requirements.length === 0) return false;

    const requirementIds = requirements.map(r => r.id);
    const { data: matches } = await supabase
      .from('bid_requirement_matches')
      .select('id')
      .in('requirement_id', requirementIds)
      .limit(1);

    return (matches && matches.length > 0) || false;
  };

  const deleteExistingMatches = async (bidId: string) => {
    const { data: requirements } = await supabase
      .from('bid_requirements')
      .select('id')
      .eq('bid_id', bidId);

    if (!requirements || requirements.length === 0) return;

    const requirementIds = requirements.map(r => r.id);
    const { error } = await supabase
      .from('bid_requirement_matches')
      .delete()
      .in('requirement_id', requirementIds);

    if (error) throw error;
  };

  const calculateMatchForBid = useMutation({
    mutationFn: async (params: { bidId: string; forceRecalculate?: boolean }) => {
      setCalculationProgress(null);

      // Delete existing matches if force recalculate
      if (params.forceRecalculate) {
        await deleteExistingMatches(params.bidId);
      }

      // Get all requirements for this bid
      const { data: requirements, error: reqError } = await supabase
        .from('bid_requirements')
        .select('*')
        .eq('bid_id', params.bidId);

      if (reqError) throw reqError;
      if (!requirements || requirements.length === 0) {
        throw new Error('Nenhum requisito encontrado para este edital');
      }

      setCalculationProgress({ current: 0, total: requirements.length });

      const results = [];
      for (let i = 0; i < requirements.length; i++) {
        const req = requirements[i];
        setCalculationProgress({ current: i + 1, total: requirements.length });
        
        // Get all active users
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('status', 'active');

        if (usersError) throw usersError;

        const matchesToInsert = [];

        // Calculate match for each user
        for (const user of users || []) {
          const { data: educations } = await supabase
            .from('academic_education')
            .select('*')
            .eq('user_id', user.user_id);

          const { data: experiences } = await supabase
            .from('professional_experiences')
            .select('*')
            .eq('user_id', user.user_id);

          const { data: userSkills } = await supabase
            .from('user_skills')
            .select('*, technical_skill:technical_skills(*)')
            .eq('user_id', user.user_id);

          const { data: certifications } = await supabase
            .from('certifications')
            .select('*')
            .eq('user_id', user.user_id);

          const scoreBreakdown = calculateScore(req, {
            educations: educations || [],
            experiences: experiences || [],
            userSkills: userSkills || [],
            certifications: certifications || [],
          });

          const totalScore = Object.values(scoreBreakdown).reduce((sum, val) => sum + val, 0);

          if (totalScore > 0) {
            matchesToInsert.push({
              requirement_id: req.id,
              user_id: user.user_id,
              match_score: totalScore,
              score_breakdown: scoreBreakdown as any,
              status: 'pending_validation' as const,
            });
          }
        }

        if (matchesToInsert.length > 0) {
          const { error } = await supabase
            .from('bid_requirement_matches')
            .upsert(matchesToInsert);

          if (error) throw error;
        }

        results.push({
          requirement: req,
          matchesFound: matchesToInsert.length,
        });
      }

      setCalculationProgress(null);

      return {
        totalRequirements: requirements.length,
        results,
        totalMatches: results.reduce((sum, r) => sum + r.matchesFound, 0),
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bid-matches-by-bid'] });
      toast.success(
        `Matching calculado para ${data.totalRequirements} requisito${data.totalRequirements !== 1 ? 's' : ''}: ${data.totalMatches} profissional${data.totalMatches !== 1 ? 'is adequados' : ' adequado'} encontrado${data.totalMatches !== 1 ? 's' : ''}`
      );
    },
    onError: (error) => {
      console.error('Error calculating match for bid:', error);
      toast.error('Erro ao calcular matching');
      setCalculationProgress(null);
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
      queryClient.invalidateQueries({ queryKey: ['bid-matches-by-bid'] });
    },
    onError: (error) => {
      console.error('Error validating match:', error);
      toast.error('Erro ao validar match');
    },
  });

  return {
    matchesByBid,
    isLoading,
    error,
    calculateMatch: calculateMatch.mutateAsync,
    calculateMatchForBid: calculateMatchForBid.mutateAsync,
    validateMatch: validateMatch.mutateAsync,
    checkExistingMatches,
    isCalculating: calculateMatch.isPending || calculateMatchForBid.isPending,
    isValidating: validateMatch.isPending,
    calculationProgress,
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
  const hasMatchingEducation = userData.educations.some((edu) => {
    const levelMatches = requirement.required_education_levels?.includes(edu.education_level);
    
    // If no fields of study required, level match is enough
    if (!requirement.required_fields_of_study || requirement.required_fields_of_study.length === 0) {
      return levelMatches;
    }
    
    // If fields of study are required, check both level and field
    const fieldMatches = requirement.required_fields_of_study.some((field) =>
      edu.field_of_study?.toLowerCase().includes(field.toLowerCase())
    );
    
    return levelMatches && fieldMatches;
  });
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
      requirement.required_certifications?.includes(cert.id)
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
