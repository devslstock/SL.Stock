-- Tabela global de preços dos planos (SaaS)
CREATE TABLE IF NOT EXISTS saas_plans (
  id VARCHAR(50) PRIMARY KEY, -- 'basico', 'profissional', 'enterprise'
  name VARCHAR(100) NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  base_users INTEGER NOT NULL DEFAULT 1,
  extra_user_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir os planos padrão
INSERT INTO saas_plans (id, name, base_price, base_users, extra_user_price)
VALUES 
  ('basico', 'Básico', 197.00, 3, 35.00),
  ('profissional', 'Profissional', 497.00, 7, 50.00),
  ('enterprise', 'Enterprise', 1290.00, 10, 100.00)
ON CONFLICT (id) DO NOTHING;
