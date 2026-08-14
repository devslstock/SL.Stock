const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  try {
    const sql = fs.readFileSync('supabase/migrations/20260814031100_create_fiscal_series.sql', 'utf8');
    const { error, data } = await supabase.rpc('execute_sql', { sql_string: sql });
    if (error) {
      console.error('Migration failed:', error);
    } else {
      console.log('Migration succeeded', data);
      await supabase.rpc('execute_sql', { sql_string: "NOTIFY pgrst, 'reload schema';" });
      console.log('Schema cache reloaded!');
    }
  } catch (err) {
    console.error(err);
  }
}
run();
