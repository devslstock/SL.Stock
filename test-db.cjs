const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env')
let envContent = ''
try { envContent = fs.readFileSync(envPath, 'utf-8') } catch(e) {}

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`))
  return match ? match[1] : process.env[key]
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL')
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY')

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: routes } = await supabase.from('delivery_routes').select('id, status, operation:operations(load_number)').order('created_at', { ascending: false }).limit(2)
  console.log('Last Routes:', routes)

  if (routes && routes.length > 0) {
    for (const r of routes) {
        const { data: clients } = await supabase.from('delivery_clients').select('id, name, status, delivery_items(*)').eq('delivery_route_id', r.id)
        console.log(`Clients for route ${r.id}:`)
        console.log(JSON.stringify(clients, null, 2))
    }
  }
}
test()
