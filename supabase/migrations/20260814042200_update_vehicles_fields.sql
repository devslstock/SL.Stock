ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT 'Veículo sem descrição';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transport_unit_type TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS owner_type TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS owner_rntrc TEXT;

NOTIFY pgrst, 'reload schema';
