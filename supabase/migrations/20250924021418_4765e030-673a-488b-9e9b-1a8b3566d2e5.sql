-- Enable realtime for dashboard tables to allow automatic updates

-- Enable replica identity for all document tables
ALTER TABLE public.certifications REPLICA IDENTITY FULL;
ALTER TABLE public.technical_attestations REPLICA IDENTITY FULL; 
ALTER TABLE public.legal_documents REPLICA IDENTITY FULL;
ALTER TABLE public.badges REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.certifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.technical_attestations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.legal_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.badges;