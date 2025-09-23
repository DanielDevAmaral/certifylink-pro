-- Create triggers to automatically update document status on insert/update
-- and run an immediate backfill using current alert settings

-- Certifications trigger
DROP TRIGGER IF EXISTS trg_update_cert_status ON public.certifications;
CREATE TRIGGER trg_update_cert_status
BEFORE INSERT OR UPDATE ON public.certifications
FOR EACH ROW
EXECUTE FUNCTION public.update_status_on_validity_change();

-- Technical attestations trigger
DROP TRIGGER IF EXISTS trg_update_tech_att_status ON public.technical_attestations;
CREATE TRIGGER trg_update_tech_att_status
BEFORE INSERT OR UPDATE ON public.technical_attestations
FOR EACH ROW
EXECUTE FUNCTION public.update_status_on_validity_change();

-- Legal documents trigger
DROP TRIGGER IF EXISTS trg_update_legal_doc_status ON public.legal_documents;
CREATE TRIGGER trg_update_legal_doc_status
BEFORE INSERT OR UPDATE ON public.legal_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_status_on_validity_change();

-- Badges trigger
DROP TRIGGER IF EXISTS trg_update_badge_status ON public.badges;
CREATE TRIGGER trg_update_badge_status
BEFORE INSERT OR UPDATE ON public.badges
FOR EACH ROW
EXECUTE FUNCTION public.update_badge_status_on_expiry_change();

-- Immediate backfill: recalculate statuses across all tables using current settings
SELECT public.update_document_status();