import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tidfrknhulukfambdaga.supabase.co', 'sb_publishable_5-SyjxAedNqhR6iU0LPIBA_v5tptd64');

async function t() {
  const {data, error} = await supabase.from('users').select('*').limit(1);
  console.log(error ? error : 'success');
}
t();
