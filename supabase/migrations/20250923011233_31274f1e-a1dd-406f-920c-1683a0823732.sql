-- Create certification platforms table
CREATE TABLE public.certification_platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certification categories table
CREATE TABLE public.certification_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certification types table
CREATE TABLE public.certification_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id UUID NOT NULL REFERENCES public.certification_platforms(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.certification_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  function TEXT,
  aliases TEXT[], -- Alternative names for search/matching
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(platform_id, name)
);

-- Enable RLS
ALTER TABLE public.certification_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certification_platforms
CREATE POLICY "All authenticated users can view platforms" 
ON public.certification_platforms 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage platforms" 
ON public.certification_platforms 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for certification_categories
CREATE POLICY "All authenticated users can view categories" 
ON public.certification_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage categories" 
ON public.certification_categories 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for certification_types  
CREATE POLICY "All authenticated users can view certification types" 
ON public.certification_types 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage certification types" 
ON public.certification_types 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Add triggers for updated_at
CREATE TRIGGER update_certification_platforms_updated_at
BEFORE UPDATE ON public.certification_platforms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certification_categories_updated_at
BEFORE UPDATE ON public.certification_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certification_types_updated_at
BEFORE UPDATE ON public.certification_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.certification_platforms (name, description) VALUES
('Google Cloud', 'Google Cloud Platform certifications'),
('Microsoft Azure', 'Microsoft Azure cloud platform certifications'),
('Amazon AWS', 'Amazon Web Services cloud certifications'),
('Oracle', 'Oracle database and cloud certifications'),
('Salesforce', 'Salesforce CRM and development certifications'),
('VMware', 'VMware virtualization and cloud infrastructure'),
('Cisco', 'Cisco networking and security certifications'),
('CompTIA', 'Computing Technology Industry Association certifications'),
('PMI', 'Project Management Institute certifications'),
('ITIL', 'Information Technology Infrastructure Library'),
('ISO', 'International Organization for Standardization');

INSERT INTO public.certification_categories (name, description) VALUES
('Cloud Architecture', 'Cloud solution design and architecture'),
('Development', 'Software development and programming'),
('Data & Analytics', 'Data science, analytics, and big data'),
('Security', 'Cybersecurity and information security'),
('DevOps', 'Development operations and automation'),
('Project Management', 'Project and program management'),
('Networking', 'Network infrastructure and administration'),
('Database', 'Database administration and development'),
('Quality Management', 'Quality assurance and management systems'),
('Machine Learning', 'AI and machine learning technologies');

-- Insert some common certification types
INSERT INTO public.certification_types (platform_id, category_id, name, full_name, function, aliases) 
SELECT 
  p.id, 
  c.id, 
  'Cloud Architect', 
  'Google Cloud Professional Cloud Architect', 
  'Arquitetura de Soluções em Nuvem',
  ARRAY['Google Cloud Architect', 'GCP Architect', 'Professional Cloud Architect']
FROM certification_platforms p, certification_categories c 
WHERE p.name = 'Google Cloud' AND c.name = 'Cloud Architecture';

INSERT INTO public.certification_types (platform_id, category_id, name, full_name, function, aliases)
SELECT 
  p.id, 
  c.id, 
  'Solutions Architect', 
  'AWS Certified Solutions Architect', 
  'Arquitetura de Soluções AWS',
  ARRAY['AWS Solutions Architect', 'AWS Architect', 'Solutions Architect Associate', 'Solutions Architect Professional']
FROM certification_platforms p, certification_categories c 
WHERE p.name = 'Amazon AWS' AND c.name = 'Cloud Architecture';

INSERT INTO public.certification_types (platform_id, category_id, name, full_name, function, aliases)
SELECT 
  p.id, 
  c.id, 
  'Azure Solutions Architect', 
  'Microsoft Azure Solutions Architect Expert', 
  'Arquitetura de Soluções Azure',
  ARRAY['Azure Architect', 'AZ-305', 'Solutions Architect Expert']
FROM certification_platforms p, certification_categories c 
WHERE p.name = 'Microsoft Azure' AND c.name = 'Cloud Architecture';