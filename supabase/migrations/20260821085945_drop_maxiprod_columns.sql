-- Remove colunas orfas da integracao Maxiprod (ferramenta descontinuada, integracao removida do codigo)
ALTER TABLE companies DROP COLUMN IF EXISTS maxiprod_api_token;
ALTER TABLE companies DROP COLUMN IF EXISTS maxiprod_last_sync;
ALTER TABLE companies DROP COLUMN IF EXISTS maxiprod_moeda_id;
ALTER TABLE companies DROP COLUMN IF EXISTS maxiprod_operacao_id;
ALTER TABLE companies DROP COLUMN IF EXISTS maxiprod_unidade_id;
ALTER TABLE customers DROP COLUMN IF EXISTS maxiprod_id;
ALTER TABLE products DROP COLUMN IF EXISTS maxiprod_id;
