import { Client } from 'pg';
import fs from 'fs';

async function runSQL() {
  const file = process.argv[2];
  if (!file) throw new Error('Missing file argument');

  const client = new Client({
    host: 'db.skcehyqjhjzqtafvuvye.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '/W9pL6TkC7q%QBW',
  });
  
  await client.connect();
  console.log(`Connected. Executing ${file}...`);
  
  const sql = fs.readFileSync(file, 'utf8');
  try {
    const res = await client.query(sql);
    console.log('Success! Results:');
    console.log(res.rows);
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

runSQL();
