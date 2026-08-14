-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  cnh TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company drivers" 
  ON drivers FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM users WHERE company_id = drivers.company_id));

CREATE POLICY "Users can insert their company drivers" 
  ON drivers FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE company_id = drivers.company_id));

CREATE POLICY "Users can update their company drivers" 
  ON drivers FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM users WHERE company_id = drivers.company_id));

CREATE POLICY "Users can delete their company drivers" 
  ON drivers FOR DELETE 
  USING (auth.uid() IN (SELECT id FROM users WHERE company_id = drivers.company_id));

CREATE TRIGGER set_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  uf TEXT NOT NULL,
  renavam TEXT,
  tara_kg DECIMAL(10,2),
  capacity_kg DECIMAL(10,2),
  capacity_m3 DECIMAL(10,2),
  body_type TEXT,
  wheel_type TEXT,
  owner_name TEXT,
  owner_document TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company vehicles" 
  ON vehicles FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM users WHERE company_id = vehicles.company_id));

CREATE POLICY "Users can insert their company vehicles" 
  ON vehicles FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE company_id = vehicles.company_id));

CREATE POLICY "Users can update their company vehicles" 
  ON vehicles FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM users WHERE company_id = vehicles.company_id));

CREATE POLICY "Users can delete their company vehicles" 
  ON vehicles FOR DELETE 
  USING (auth.uid() IN (SELECT id FROM users WHERE company_id = vehicles.company_id));

CREATE TRIGGER set_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

NOTIFY pgrst, 'reload schema';
