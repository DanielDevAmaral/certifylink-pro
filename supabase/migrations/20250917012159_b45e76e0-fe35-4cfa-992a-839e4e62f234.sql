-- First, let's check and fix existing foreign key constraints
-- Drop existing foreign key constraints if they exist and point to wrong tables
DO $$
BEGIN
  -- Drop existing foreign key constraints if they exist
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'certifications_user_id_fkey') THEN
    ALTER TABLE public.certifications DROP CONSTRAINT certifications_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'technical_attestations_user_id_fkey') THEN
    ALTER TABLE public.technical_attestations DROP CONSTRAINT technical_attestations_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'legal_documents_user_id_fkey') THEN
    ALTER TABLE public.legal_documents DROP CONSTRAINT legal_documents_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notifications_user_id_fkey') THEN
    ALTER TABLE public.notifications DROP CONSTRAINT notifications_user_id_fkey;
  END IF;
END $$;

-- Now add the correct foreign key relationships to profiles table
ALTER TABLE public.certifications 
ADD CONSTRAINT certifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.technical_attestations 
ADD CONSTRAINT technical_attestations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.legal_documents 
ADD CONSTRAINT legal_documents_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;