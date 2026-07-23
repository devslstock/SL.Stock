-- Migração para garantir que o nome de usuário (username) seja único no sistema

-- 1. Higienizar usernames existentes (remover espaços extras e colocar em minúsculas)
UPDATE public.users SET username = LOWER(TRIM(username));

-- 2. Adicionar restrição de unicidade (Unique Constraint) na tabela public.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
