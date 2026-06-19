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
  await client.query("SET request.jwt.claims = '{ \"sub\": \"f1a6c0f3-13bc-4e3f-9e7b-efd2fc955d99\", \"app_metadata\": {} }'");
  const res = await client.query('SELECT public.is_super_admin()');
  console.log(res.rows);
  
  // also check if they can insert into companies
  try {
    const r2 = await client.query("INSERT INTO public.companies (name, slug) VALUES ('Test', 'test-123') RETURNING id");
    console.log('Insert company success:', r2.rows);
  } catch(e) {
    console.log('Insert company failed:', e.message);
  }
  await client.end();
}
run();
