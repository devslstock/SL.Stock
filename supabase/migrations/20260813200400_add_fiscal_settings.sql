CREATE TABLE IF NOT EXISTS fiscal_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  default_cfop TEXT,
  default_csosn TEXT,
  default_cst TEXT,
  default_ncm TEXT,
  default_pis TEXT,
  default_cofins TEXT,
  default_icms_rate DECIMAL(5,2),
  default_ipi_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE fiscal_settings ENABLE ROW LEVEL SECURITY;

-- Politica para permitir que os usuários acessem as configurações de suas empresas
CREATE POLICY "Users can view fiscal settings of their company" ON fiscal_settings
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fiscal settings of their company" ON fiscal_settings
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert fiscal settings of their company" ON fiscal_settings
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE auth_user_id = auth.uid()
    )
  );
