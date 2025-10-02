-- Criar tabela de Verticais de Negócio
CREATE TABLE public.business_verticals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de Plataformas Tecnológicas
CREATE TABLE public.tech_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar novas colunas à tabela technical_attestations
ALTER TABLE public.technical_attestations 
ADD COLUMN document_type text DEFAULT 'technical_attestation',
ADD COLUMN business_vertical_id uuid REFERENCES public.business_verticals(id),
ADD COLUMN tech_platform_id uuid REFERENCES public.tech_platforms(id);

-- Adicionar constraint para tipos válidos
ALTER TABLE public.technical_attestations
ADD CONSTRAINT valid_document_type 
CHECK (document_type IN ('technical_attestation', 'project_case', 'success_case'));

-- Inserir dados iniciais de Verticais de Negócio
INSERT INTO public.business_verticals (name, description) VALUES
  ('Agronegócio', 'Agricultura, pecuária e agrotecnologia'),
  ('Saúde', 'Hospitais, clínicas, healthtech e telemedicina'),
  ('Financeiro', 'Bancos, fintechs, seguros e mercado de capitais'),
  ('Varejo', 'Comércio físico e digital, e-commerce'),
  ('Indústria', 'Manufatura, automação e produção'),
  ('Educação', 'Instituições de ensino, edtechs e treinamentos'),
  ('Governo', 'Órgãos públicos federais, estaduais e municipais'),
  ('Telecomunicações', 'Operadoras, provedores e infraestrutura'),
  ('Energia', 'Geração, transmissão e distribuição de energia'),
  ('Logística', 'Transporte, armazenagem e supply chain');

-- Inserir dados iniciais de Plataformas
INSERT INTO public.tech_platforms (name, description) VALUES
  ('Google Cloud Platform', 'Plataforma de nuvem do Google (GCP)'),
  ('Amazon Web Services', 'Plataforma de nuvem da Amazon (AWS)'),
  ('Oracle Cloud Infrastructure', 'Plataforma de nuvem da Oracle (OCI)'),
  ('Microsoft Azure', 'Plataforma de nuvem da Microsoft'),
  ('IBM Cloud', 'Plataforma de nuvem da IBM'),
  ('Alibaba Cloud', 'Plataforma de nuvem da Alibaba'),
  ('On-Premises', 'Infraestrutura própria do cliente'),
  ('Multi-Cloud', 'Arquitetura em múltiplas plataformas de nuvem');

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.business_verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_platforms ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para business_verticals
CREATE POLICY "Authenticated users can view verticals"
  ON public.business_verticals FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage verticals"
  ON public.business_verticals FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Políticas RLS para tech_platforms
CREATE POLICY "Authenticated users can view platforms"
  ON public.tech_platforms FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage platforms"
  ON public.tech_platforms FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Trigger para atualizar updated_at em business_verticals
CREATE TRIGGER update_business_verticals_updated_at
BEFORE UPDATE ON public.business_verticals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em tech_platforms
CREATE TRIGGER update_tech_platforms_updated_at
BEFORE UPDATE ON public.tech_platforms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();