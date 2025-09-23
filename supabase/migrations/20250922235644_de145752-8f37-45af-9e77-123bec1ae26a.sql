-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon_url TEXT,
  image_url TEXT,
  issued_date DATE NOT NULL,
  expiry_date DATE,
  status document_status NOT NULL DEFAULT 'valid',
  public_link TEXT,
  verification_code TEXT,
  issuer_name TEXT,
  issuer_logo_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Create policies for badges
CREATE POLICY "All authenticated users can view badges" 
ON public.badges 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own badges" 
ON public.badges 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all badges" 
ON public.badges 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_badges_updated_at
BEFORE UPDATE ON public.badges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_badges_user_id ON public.badges(user_id);
CREATE INDEX idx_badges_category ON public.badges(category);
CREATE INDEX idx_badges_status ON public.badges(status);
CREATE INDEX idx_badges_issued_date ON public.badges(issued_date);