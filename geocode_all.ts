import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tidfrknhulukfambdaga.supabase.co'
const SUPABASE_KEY = 'sb_publishable_5-SyjxAedNqhR6iU0LPIBA_v5tptd64' // Using anon key, we should bypass RLS or assume it has access. Wait, if it's anon key, it might not have write access to all rows due to RLS unless the user is authenticated. 

// Actually, maybe it's better to just write a SQL script? But SQL can't call external API easily.
// I will just use the anon key. If RLS blocks it, I might need the service role key. 
// Let's check if we can get the service role key from the user, or if we can use the VITE_SUPABASE_ANON_KEY to login first. 

// Since we are running this script locally, maybe the user is not authenticated.
// Let's use fetch instead to call the local Vite dev server? No.

// Wait, Nominatim rate limits to 1 req/sec. Let's just write the script and see if it works.

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function geocode(address: string) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
      headers: {
        'Accept-Language': 'pt-BR',
        'User-Agent': 'EstoqueFacil/1.0'
      }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

async function run() {
  // First we need to login if RLS is enabled.
  // The user might be logged in in their browser, but not in this script.
  // We can try without login first. If it fails, I'll ask for an email/password.
  
  console.log('Fetching customers...')
  const { data: customers, error: errC } = await supabase.from('customers').select('id, address, number, neighborhood, city, state').is('latitude', null).not('address', 'is', null).neq('address', '')
  
  if (errC) {
    console.error('Error fetching customers:', errC)
    return
  }

  console.log(`Found ${customers?.length || 0} customers without coordinates.`)
  
  for (const c of (customers || [])) {
    const fullAddress = `${c.address}, ${c.number || ''}, ${c.neighborhood || ''}, ${c.city || ''} - ${c.state || ''}`.replace(/,\s*,/g, ',').trim()
    console.log(`Geocoding customer ${c.id}: ${fullAddress}`)
    const coords = await geocode(fullAddress)
    if (coords) {
      const { error } = await supabase.from('customers').update({ latitude: coords.lat, longitude: coords.lng }).eq('id', c.id)
      if (error) console.error('Error updating:', error)
      else console.log('Updated OK.')
    } else {
      console.log('Not found.')
    }
    await sleep(1500) // Respect Nominatim rate limit
  }

  console.log('Fetching delivery clients...')
  const { data: deliveryClients, error: errD } = await supabase.from('delivery_clients').select('id, address').is('latitude', null).not('address', 'is', null).neq('address', '')
  
  if (errD) {
    console.error('Error fetching delivery clients:', errD)
    return
  }

  console.log(`Found ${deliveryClients?.length || 0} delivery clients without coordinates.`)

  for (const d of (deliveryClients || [])) {
    console.log(`Geocoding delivery client ${d.id}: ${d.address}`)
    const coords = await geocode(d.address)
    if (coords) {
      const { error } = await supabase.from('delivery_clients').update({ latitude: coords.lat, longitude: coords.lng }).eq('id', d.id)
      if (error) console.error('Error updating:', error)
      else console.log('Updated OK.')
    } else {
      console.log('Not found.')
    }
    await sleep(1500)
  }

  console.log('Fetching companies...')
  const { data: companies, error: errComp } = await supabase.from('companies').select('id, garage_address').is('garage_lat', null).not('garage_address', 'is', null).neq('garage_address', '')
  
  if (errComp) {
    console.error('Error fetching companies:', errComp)
    return
  }

  console.log(`Found ${companies?.length || 0} companies without garage coordinates.`)

  for (const comp of (companies || [])) {
    console.log(`Geocoding company ${comp.id}: ${comp.garage_address}`)
    const coords = await geocode(comp.garage_address)
    if (coords) {
      const { error } = await supabase.from('companies').update({ garage_lat: coords.lat, garage_lng: coords.lng }).eq('id', comp.id)
      if (error) console.error('Error updating:', error)
      else console.log('Updated OK.')
    } else {
      console.log('Not found.')
    }
    await sleep(1500)
  }

  console.log('Done!')
}

run()
