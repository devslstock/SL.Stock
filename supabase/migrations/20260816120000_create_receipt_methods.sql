-- Create table for Receipt Methods (Formas de Recebimento)
create table public.receipt_methods (
    id uuid default gen_random_uuid() primary key,
    company_id uuid references public.companies(id) on delete cascade not null,
    name text not null,
    type text not null check (type in ('banco', 'pix', 'outros')),
    
    -- Bank fields
    bank text,
    bank_code text,
    agency text,
    account_number text,
    account_digit text,
    account_type text,
    
    -- PIX fields
    pix_key_type text,
    pix_key text,
    linked_bank text,
    linked_account text,
    
    -- Common fields
    holder_name text,
    holder_document text,
    notes text,
    status text default 'Ativo' check (status in ('Ativo', 'Inativo')),
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.receipt_methods enable row level security;

create policy "Users can view receipt methods of their company"
    on public.receipt_methods for select
    using (company_id = (select company_id from public.users where id = auth.uid()));

create policy "Users can insert receipt methods of their company"
    on public.receipt_methods for insert
    with check (company_id = (select company_id from public.users where id = auth.uid()));

create policy "Users can update receipt methods of their company"
    on public.receipt_methods for update
    using (company_id = (select company_id from public.users where id = auth.uid()))
    with check (company_id = (select company_id from public.users where id = auth.uid()));

create policy "Users can delete receipt methods of their company"
    on public.receipt_methods for delete
    using (company_id = (select company_id from public.users where id = auth.uid()));

-- Triggers for updated_at
create trigger update_receipt_methods_updated_at
    before update on public.receipt_methods
    for each row execute function public.update_updated_at_column();
