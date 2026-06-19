import { createClient } from '@supabase/supabase-js'; 
import { config } from 'dotenv'; 
config({ path: '.env.local' }); 
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!); 
supabase.from('equipment_orders').select('id, os_number, status, delivery_route_id, company_id').limit(15).then(console.log);
