-- Add foreign key relationships to fix join queries
-- First, add foreign key from certifications.user_id to profiles.user_id
ALTER TABLE public.certifications 
ADD CONSTRAINT certifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from technical_attestations.user_id to profiles.user_id
ALTER TABLE public.technical_attestations 
ADD CONSTRAINT technical_attestations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from legal_documents.user_id to profiles.user_id
ALTER TABLE public.legal_documents 
ADD CONSTRAINT legal_documents_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from notifications.user_id to profiles.user_id
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;