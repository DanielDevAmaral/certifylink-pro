-- ============================================
-- Allow authenticated users to read profile data for matching purposes
-- ============================================

-- Academic Education: Allow all authenticated users to view
CREATE POLICY "Authenticated users can view all education for matching"
ON public.academic_education
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Professional Experiences: Allow all authenticated users to view
CREATE POLICY "Authenticated users can view all experiences for matching"
ON public.professional_experiences
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- User Skills: Allow all authenticated users to view
CREATE POLICY "Authenticated users can view all skills for matching"
ON public.user_skills
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Certifications: Allow all authenticated users to view
CREATE POLICY "Authenticated users can view all certifications for matching"
ON public.certifications
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Profiles: Allow all authenticated users to view basic profile info
CREATE POLICY "Authenticated users can view basic profiles for matching"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);