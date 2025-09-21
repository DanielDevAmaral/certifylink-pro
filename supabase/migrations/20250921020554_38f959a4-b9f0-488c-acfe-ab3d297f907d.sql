-- Add RLS policies to allow admins to manage all technical attestations and legal documents

-- Technical Attestations - Admin policies
CREATE POLICY "Admins can update all technical attestations" 
ON public.technical_attestations 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Admins can delete all technical attestations" 
ON public.technical_attestations 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Legal Documents - Admin policies  
CREATE POLICY "Admins can update all legal documents" 
ON public.legal_documents 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Admins can delete all legal documents" 
ON public.legal_documents 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);