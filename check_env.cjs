const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'supabase/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('companies').select('name, focusnfe_env');
  console.log('Companies:', data);
  
  const { data: nfe, error: err2 } = await supabase.from('nfe_records').select('*').order('created_at', { ascending: false }).limit(2);
  console.log('Last NFes:', nfe);
}

run();
