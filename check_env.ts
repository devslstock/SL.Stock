import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import 'https://deno.land/std@0.177.0/dotenv/load.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl!, supabaseKey!)

async function run() {
  const { data, error } = await supabase.from('companies').select('name, focusnfe_env')
  console.log('Companies:', data)
  
  const { data: nfe, error: err2 } = await supabase.from('nfe_records').select('*').order('created_at', { ascending: false }).limit(2)
  console.log('Last NFes:', nfe)
}

run()
