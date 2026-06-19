-- Fix RLS Policies for companies
drop policy if exists "Admins/Gestors can update companies" on public.companies;
create policy "Admins/Gestors can update companies" on public.companies
    for update using (
        id = (select company_id from public.users where id = auth.uid()) and
        exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'gestor', 'master'))
    );
