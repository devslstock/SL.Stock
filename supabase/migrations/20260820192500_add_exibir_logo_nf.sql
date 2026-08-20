-- Add exibir_logo_nf to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS exibir_logo_nf BOOLEAN DEFAULT false;
