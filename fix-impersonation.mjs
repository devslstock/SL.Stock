import { Client } from 'pg';
const client = new Client({
  host: 'db.skcehyqjhjzqtafvuvye.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '/W9pL6TkC7q%QBW'
});

async function run() {
  await client.connect();

  await client.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS impersonated_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;');

  await client.query(`
    create or replace function public.current_company_id()
    returns uuid
    language sql security definer stable
    set search_path = public
    as $$
      select coalesce(impersonated_company_id, company_id) from public.users where auth_user_id = auth.uid() and active = true limit 1;
    $$;
  `);

  console.log('Impersonation fixed in DB!');
  await client.end();
}
run();
