import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const sql = fs.readFileSync('supabase/migrations/20260814031100_create_fiscal_series.sql', 'utf8')
  
  // We can just execute it entirely if execute_sql supports multiple statements, but let's be safe:
  const { error } = await supabase.rpc('execute_sql', { sql_string: sql })
  
  if (error) {
    console.error('Migration failed:', error)
  } else {
    console.log('Migration executed successfully')
    // Notify postgrest to reload cache
    await supabase.rpc('execute_sql', { sql_string: "NOTIFY pgrst, 'reload schema';" })
    console.log('Schema reloaded')
  }
}
run()
