-- Remove the existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT profiles_status_check;

-- Add the updated check constraint that includes 'terminated'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text, 'terminated'::text]));