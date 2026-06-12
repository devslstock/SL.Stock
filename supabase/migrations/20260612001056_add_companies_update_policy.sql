-- Allow authenticated users to update companies table
-- The UI already restricts access to this page to admins/gestores
CREATE POLICY "Allow authenticated users to update companies"
ON public.companies
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
