-- Drop old columns
ALTER TABLE companies DROP COLUMN IF EXISTS last_nfe_number;
ALTER TABLE companies DROP COLUMN IF EXISTS nfe_series;

-- Create fiscal_series table
CREATE TABLE IF NOT EXISTS fiscal_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  series_number INT NOT NULL DEFAULT 1,
  next_number INT NOT NULL DEFAULT 1,
  document_type TEXT NOT NULL DEFAULT 'NENHUM',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE fiscal_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company fiscal_series" 
  ON fiscal_series FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM users WHERE company_id = fiscal_series.company_id));

CREATE POLICY "Users can insert their company fiscal_series" 
  ON fiscal_series FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE company_id = fiscal_series.company_id));

CREATE POLICY "Users can update their company fiscal_series" 
  ON fiscal_series FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM users WHERE company_id = fiscal_series.company_id));

CREATE POLICY "Users can delete their company fiscal_series" 
  ON fiscal_series FOR DELETE 
  USING (auth.uid() IN (SELECT id FROM users WHERE company_id = fiscal_series.company_id));

-- Trigger to update updated_at
CREATE TRIGGER set_fiscal_series_updated_at
  BEFORE UPDATE ON fiscal_series
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
