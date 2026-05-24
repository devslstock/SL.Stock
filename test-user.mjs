import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tidfrknhulukfambdaga.supabase.co', 'sb_publishable_5-SyjxAedNqhR6iU0LPIBA_v5tptd64');

async function t() {
  const {data} = await supabase.from('users').select('id, is_super_admin').eq('username', 'lucas.soares');
  console.log(data);
}
t();
