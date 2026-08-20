const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'supabase/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: events, error } = await supabase
    .from('nfe_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  console.log('Latest NFE Events:', JSON.stringify(events, null, 2));
}

run();
