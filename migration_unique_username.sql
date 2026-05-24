-- ==============================================================================
-- MIGRAÇÃO PARA GARANTIR NOMES DE USUÁRIO ÚNICOS
-- ==============================================================================

-- 1. Normalizar usernames já cadastrados para minúsculas e sem espaços nas bordas
UPDATE public.users SET username = LOWER(TRIM(username));

-- 2. Adicionar a restrição de Unicidade na coluna username da tabela users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);

-- ==============================================================================
-- FIM DA MIGRAÇÃO
-- ==============================================================================
