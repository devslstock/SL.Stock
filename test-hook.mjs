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
  const res = await client.query(`select public.custom_access_token_hook('{"user_id": "f1a6c0f3-13bc-4e3f-9e7b-efd2fc955d99"}'::jsonb)`);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run();
