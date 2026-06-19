import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qokshpsdixozjtsjnvqw.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from('equipment_orders')
    .select('*, customer:customers(legal_name, fantasy_name, document)')
    .order('created_at', { ascending: false })
    .limit(5)
  console.log(JSON.stringify(data, null, 2))
}
test()
