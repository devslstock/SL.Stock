-- Drop incorrect policies for fiscal_series
DROP POLICY IF EXISTS "Users can view their company fiscal_series" ON fiscal_series;
DROP POLICY IF EXISTS "Users can insert their company fiscal_series" ON fiscal_series;
DROP POLICY IF EXISTS "Users can update their company fiscal_series" ON fiscal_series;
DROP POLICY IF EXISTS "Users can delete their company fiscal_series" ON fiscal_series;

-- Recreate correct policies for fiscal_series
CREATE POLICY "Users can view their company fiscal_series" ON fiscal_series
  FOR SELECT USING (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their company fiscal_series" ON fiscal_series
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their company fiscal_series" ON fiscal_series
  FOR UPDATE USING (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete their company fiscal_series" ON fiscal_series
  FOR DELETE USING (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

-- Drop incorrect policies for vehicles
DROP POLICY IF EXISTS "Users can view their company vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert their company vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update their company vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete their company vehicles" ON vehicles;

-- Recreate correct policies for vehicles
CREATE POLICY "Users can view their company vehicles" ON vehicles
  FOR SELECT USING (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their company vehicles" ON vehicles
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their company vehicles" ON vehicles
  FOR UPDATE USING (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete their company vehicles" ON vehicles
  FOR DELETE USING (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

-- Drop incorrect policies for drivers
DROP POLICY IF EXISTS "Users can view their company drivers" ON drivers;
DROP POLICY IF EXISTS "Users can insert their company drivers" ON drivers;
DROP POLICY IF EXISTS "Users can update their company drivers" ON drivers;
DROP POLICY IF EXISTS "Users can delete their company drivers" ON drivers;

-- Recreate correct policies for drivers
CREATE POLICY "Users can view their company drivers" ON drivers
  FOR SELECT USING (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their company drivers" ON drivers
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their company drivers" ON drivers
  FOR UPDATE USING (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete their company drivers" ON drivers
  FOR DELETE USING (company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

NOTIFY pgrst, 'reload schema';
