// Knowledge Library Types

export type EducationLevel = 
  | 'ensino_medio'
  | 'tecnologo'
  | 'graduacao'
  | 'pos_graduacao'
  | 'mba'
  | 'mestrado'
  | 'doutorado'
  | 'pos_doutorado';

export type EducationStatus = 'completed' | 'in_progress' | 'incomplete';

export type SkillCategory = 
  | 'programming_language'
  | 'framework'
  | 'methodology'
  | 'tool'
  | 'soft_skill'
  | 'domain_knowledge';

export type ProficiencyLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';

export type MatchStatus = 'pending_validation' | 'validated' | 'rejected';

export interface AcademicEducation {
  id: string;
  user_id: string;
  education_level: EducationLevel;
  institution_name: string;
  course_name: string;
  field_of_study: string;
  start_date: string;
  completion_date?: string;
  document_url?: string;
  status: EducationStatus;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalExperience {
  id: string;
  user_id: string;
  company_name: string;
  position: string;
  start_date: string;
  end_date?: string;
  description?: string;
  skills_applied?: string[];
  tech_platforms_used?: string[];
  business_verticals?: string[];
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface TechnicalSkill {
  id: string;
  name: string;
  category: SkillCategory;
  description?: string;
  related_certifications?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level: ProficiencyLevel;
  years_of_experience: number;
  last_used_date?: string;
  endorsed_by?: string[];
  created_at: string;
  updated_at: string;
  technical_skill?: TechnicalSkill;
}

export interface BidRequirement {
  id: string;
  bid_name: string;
  bid_code: string;
  requirement_code: string;
  role_title: string;
  required_education_levels?: string[];
  required_fields_of_study?: string[];
  required_experience_years: number;
  required_skills?: string[];
  required_certifications?: string[];
  keywords?: string[];
  full_description: string;
  quantity_needed: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScoreBreakdown {
  education_match: number;
  experience_years_match: number;
  skills_match: number;
  certifications_match: number;
}

export interface BidRequirementMatch {
  id: string;
  requirement_id: string;
  user_id: string;
  match_score: number;
  score_breakdown: ScoreBreakdown;
  status: MatchStatus;
  validated_by?: string;
  validated_at?: string;
  validation_notes?: string;
  created_at: string;
  updated_at: string;
  requirement?: BidRequirement;
  user_profile?: {
    full_name: string;
    email: string;
    position?: string;
  };
}

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  ensino_medio: 'Ensino Médio',
  tecnologo: 'Tecnólogo',
  graduacao: 'Graduação',
  pos_graduacao: 'Pós-Graduação',
  mba: 'MBA',
  mestrado: 'Mestrado',
  doutorado: 'Doutorado',
  pos_doutorado: 'Pós-Doutorado',
};

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  programming_language: 'Linguagem de Programação',
  framework: 'Framework',
  methodology: 'Metodologia',
  tool: 'Ferramenta',
  soft_skill: 'Soft Skill',
  domain_knowledge: 'Conhecimento de Domínio',
};

export const PROFICIENCY_LEVEL_LABELS: Record<ProficiencyLevel, string> = {
  basic: 'Básico',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
  expert: 'Especialista',
};
