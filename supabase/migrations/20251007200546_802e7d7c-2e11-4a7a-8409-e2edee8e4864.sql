-- Create enums for the knowledge library system
CREATE TYPE education_level AS ENUM (
  'ensino_medio',
  'tecnologo', 
  'graduacao',
  'pos_graduacao',
  'mba',
  'mestrado',
  'doutorado',
  'pos_doutorado'
);

CREATE TYPE education_status AS ENUM (
  'completed',
  'in_progress',
  'incomplete'
);

CREATE TYPE skill_category AS ENUM (
  'programming_language',
  'framework',
  'methodology',
  'tool',
  'soft_skill',
  'domain_knowledge'
);

CREATE TYPE proficiency_level AS ENUM (
  'basic',
  'intermediate',
  'advanced',
  'expert'
);

CREATE TYPE match_status AS ENUM (
  'pending_validation',
  'validated',
  'rejected'
);

-- Table: academic_education (Formação Acadêmica)
CREATE TABLE public.academic_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  education_level education_level NOT NULL,
  institution_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  start_date DATE NOT NULL,
  completion_date DATE,
  document_url TEXT,
  status education_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: professional_experiences (Experiências Profissionais)
CREATE TABLE public.professional_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  skills_applied TEXT[],
  tech_platforms_used UUID[],
  business_verticals UUID[],
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: technical_skills (Biblioteca de Competências)
CREATE TABLE public.technical_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category skill_category NOT NULL,
  description TEXT,
  related_certifications UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: user_skills (Competências por Usuário)
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.technical_skills(id) ON DELETE CASCADE,
  proficiency_level proficiency_level NOT NULL DEFAULT 'intermediate',
  years_of_experience NUMERIC DEFAULT 0,
  last_used_date DATE,
  endorsed_by UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Table: bid_requirements (Requisitos de Editais)
CREATE TABLE public.bid_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_name TEXT NOT NULL,
  bid_code TEXT NOT NULL,
  requirement_code TEXT NOT NULL,
  role_title TEXT NOT NULL,
  required_education_levels TEXT[],
  required_fields_of_study TEXT[],
  required_experience_years NUMERIC NOT NULL DEFAULT 0,
  required_skills UUID[],
  required_certifications TEXT[],
  keywords TEXT[],
  full_description TEXT NOT NULL,
  quantity_needed INTEGER DEFAULT 1,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: bid_requirement_matches (Correspondências)
CREATE TABLE public.bid_requirement_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.bid_requirements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  status match_status NOT NULL DEFAULT 'pending_validation',
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  validation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(requirement_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.academic_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_requirement_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academic_education
CREATE POLICY "Users can manage own education"
  ON public.academic_education FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Leaders can view team education"
  ON public.academic_education FOR SELECT
  USING (is_direct_team_leader(auth.uid(), user_id));

CREATE POLICY "Admins can view all education"
  ON public.academic_education FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for professional_experiences
CREATE POLICY "Users can manage own experiences"
  ON public.professional_experiences FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Leaders can view team experiences"
  ON public.professional_experiences FOR SELECT
  USING (is_direct_team_leader(auth.uid(), user_id));

CREATE POLICY "Admins can view all experiences"
  ON public.professional_experiences FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for technical_skills
CREATE POLICY "Authenticated users can view skills"
  ON public.technical_skills FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage skills"
  ON public.technical_skills FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for user_skills
CREATE POLICY "Users can manage own skills"
  ON public.user_skills FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Leaders can view team skills"
  ON public.user_skills FOR SELECT
  USING (is_direct_team_leader(auth.uid(), user_id));

CREATE POLICY "Admins can view all user skills"
  ON public.user_skills FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for bid_requirements
CREATE POLICY "Authenticated users can view requirements"
  ON public.bid_requirements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage requirements"
  ON public.bid_requirements FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for bid_requirement_matches
CREATE POLICY "Users can view own matches"
  ON public.bid_requirement_matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all matches"
  ON public.bid_requirement_matches FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Create indexes for better performance
CREATE INDEX idx_academic_education_user_id ON public.academic_education(user_id);
CREATE INDEX idx_professional_experiences_user_id ON public.professional_experiences(user_id);
CREATE INDEX idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON public.user_skills(skill_id);
CREATE INDEX idx_bid_requirements_code ON public.bid_requirements(bid_code);
CREATE INDEX idx_bid_requirement_matches_requirement_id ON public.bid_requirement_matches(requirement_id);
CREATE INDEX idx_bid_requirement_matches_user_id ON public.bid_requirement_matches(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_academic_education_updated_at
  BEFORE UPDATE ON public.academic_education
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_experiences_updated_at
  BEFORE UPDATE ON public.professional_experiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technical_skills_updated_at
  BEFORE UPDATE ON public.technical_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bid_requirements_updated_at
  BEFORE UPDATE ON public.bid_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bid_requirement_matches_updated_at
  BEFORE UPDATE ON public.bid_requirement_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();