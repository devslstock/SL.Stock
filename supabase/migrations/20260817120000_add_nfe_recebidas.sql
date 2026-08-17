-- Create table for storing received NFes metadata from Focus NFe
CREATE TABLE public.nfe_recebidas (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  chave_nfe text NOT NULL,
  nome_emitente text,
  documento_emitente text,
  valor_total numeric(12,2),
  data_emissao timestamp with time zone,
  situacao text,
  manifestacao_destinatario text,
  nfe_completa boolean DEFAULT false,
  versao integer NOT NULL,
  xml_content text,
  status_importacao text DEFAULT 'pendente', -- pendente, importada, ignorada
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Um CNPJ só pode ter uma mesma chave de nota
  UNIQUE(company_id, chave_nfe)
);

-- Enable RLS
ALTER TABLE public.nfe_recebidas ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view nfe_recebidas of their company" ON public.nfe_recebidas 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE users.company_id = nfe_recebidas.company_id OR users.is_super_admin = true
    )
  );

CREATE POLICY "Users can insert nfe_recebidas of their company" ON public.nfe_recebidas 
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE users.company_id = nfe_recebidas.company_id OR users.is_super_admin = true
    )
  );

CREATE POLICY "Users can update nfe_recebidas of their company" ON public.nfe_recebidas 
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE users.company_id = nfe_recebidas.company_id OR users.is_super_admin = true
    )
  );

CREATE POLICY "Users can delete nfe_recebidas of their company" ON public.nfe_recebidas 
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE users.company_id = nfe_recebidas.company_id OR users.is_super_admin = true
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER handle_nfe_recebidas_updated_at BEFORE UPDATE ON public.nfe_recebidas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
