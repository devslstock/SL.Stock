import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tidfrknhulukfambdaga.supabase.co';
const supabaseKey = 'sb_publishable_5-SyjxAedNqhR6iU0LPIBA_v5tptd64';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: comp, error: errC } = await supabase.from('companies').select('*').limit(1).single();
  if (errC || !comp) {
    console.log('No companies found', errC);
    return;
  }
  console.log('Using company:', comp.id);
  
  // Try inserting payment
  const { data, error } = await supabase.from('company_payments').insert([{
    company_id: comp.id,
    amount: 100.50,
    status: 'pendente',
    due_date: '2026-06-01',
    notes: 'test'
  }]).select();

  console.log('Result:', data, error);
}

test();
