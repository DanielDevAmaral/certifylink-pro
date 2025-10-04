-- Add public_link column to technical_attestations table
ALTER TABLE public.technical_attestations 
ADD COLUMN IF NOT EXISTS public_link TEXT;

COMMENT ON COLUMN public.technical_attestations.public_link IS 'Link público para compartilhamento do atestado técnico via QR Code';

-- Add public_link column to legal_documents table
ALTER TABLE public.legal_documents 
ADD COLUMN IF NOT EXISTS public_link TEXT;

COMMENT ON COLUMN public.legal_documents.public_link IS 'Link público para compartilhamento do documento legal via QR Code';