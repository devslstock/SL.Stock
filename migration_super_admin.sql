-- Adicionar a coluna de super administrador na tabela de usuários
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Dar o super poder ao usuário Lucas
UPDATE public.users SET is_super_admin = true WHERE username = 'lucas.soares';
