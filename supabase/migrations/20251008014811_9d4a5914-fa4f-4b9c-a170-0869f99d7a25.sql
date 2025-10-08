-- ============================================
-- Allow authenticated users to manage matches for bid analysis
-- ============================================

-- Allow all authenticated users to manage matches (needed for matching engine)
CREATE POLICY "Authenticated users can manage all matches for analysis"
ON public.bid_requirement_matches
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);