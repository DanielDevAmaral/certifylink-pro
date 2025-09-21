-- Update existing certifications with equivalences to be approved
-- This fixes the issue where manual equivalences were showing "Aguardando aprovação"
UPDATE public.certifications 
SET approved_equivalence = true, updated_at = NOW()
WHERE equivalence_services IS NOT NULL 
  AND array_length(equivalence_services, 1) > 0 
  AND approved_equivalence = false;