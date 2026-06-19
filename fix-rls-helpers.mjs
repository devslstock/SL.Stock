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

  const sql = `
    create or replace function public.current_company_id()
    returns uuid
    language sql security definer stable
    set search_path = public
    as $$
      select company_id from public.users where auth_user_id = auth.uid() and active = true limit 1;
    $$;

    create or replace function public.is_super_admin()
    returns boolean
    language sql security definer stable
    set search_path = public
    as $$
      select coalesce((select is_super_admin from public.users where auth_user_id = auth.uid() and active = true limit 1), false);
    $$;

    create or replace function public.current_user_role()
    returns text
    language sql security definer stable
    set search_path = public
    as $$
      select role::text from public.users where auth_user_id = auth.uid() and active = true limit 1;
    $$;
  `;

  try {
    await client.query(sql);
    console.log('Functions updated to Security Definer bypass!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
