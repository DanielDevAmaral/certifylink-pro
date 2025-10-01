-- Add tags, hours_breakdown, and total_hours columns to technical_attestations table
ALTER TABLE public.technical_attestations 
ADD COLUMN tags text[] DEFAULT '{}',
ADD COLUMN hours_breakdown jsonb DEFAULT '{}',
ADD COLUMN total_hours numeric DEFAULT 0;

-- Add comment to explain the structure
COMMENT ON COLUMN public.technical_attestations.tags IS 'Array of tags for categorizing technical work (e.g., ["LLM", "Frontend", "Backend"])';
COMMENT ON COLUMN public.technical_attestations.hours_breakdown IS 'JSON object mapping tags to hours spent: {"LLM": 40, "Frontend": 60}';
COMMENT ON COLUMN public.technical_attestations.total_hours IS 'Total hours calculated from hours_breakdown';