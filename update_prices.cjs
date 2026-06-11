require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const text = fs.readFileSync('parsed_pdf.txt', 'utf8');
  const lines = text.split('\n');
  
  const updates = [];
  
  for (const line of lines) {
    const match = line.match(/^(\d+)\s+(.+?)\s+([\d,]+)\/[A-Za-z0-9]+$/);
    if (match) {
      const code = match[1];
      const desc = match[2];
      const priceStr = match[3];
      const price = parseFloat(priceStr.replace(',', '.'));
      updates.push({ code, price, desc });
    }
  }
  
  console.log(`Found ${updates.length} items to update.`);
  
  // Find "Tabela Geral"
  const { data: tableData, error: tableErr } = await supabase
    .from('price_tables')
    .select('id')
    .ilike('name', '%Tabela Geral%')
    .limit(1)
    .single();
    
  if (tableErr || !tableData) {
    console.error('Error finding table:', tableErr);
    return;
  }
  
  const tableId = tableData.id;
  console.log('Tabela Geral ID:', tableId);
  
  let successCount = 0;
  let notFoundCount = 0;
  
  for (const { code, price, desc } of updates) {
    // find product by code
    const { data: prodData } = await supabase
      .from('products')
      .select('id, code')
      .eq('code', code)
      .limit(1)
      .single();
      
    if (!prodData) {
      console.log(`Product code ${code} not found in DB!`);
      notFoundCount++;
      continue;
    }
    
    // update price_table_items
    const { data: updateData, error: updateErr } = await supabase
      .from('price_table_items')
      .update({ price })
      .eq('price_table_id', tableId)
      .eq('product_id', prodData.id)
      .select();
      
    if (updateErr) {
      console.error(`Error updating price for ${code}:`, updateErr);
    } else if (updateData.length === 0) {
      // Insert it!
      const { error: insErr } = await supabase
        .from('price_table_items')
        .insert({ price_table_id: tableId, product_id: prodData.id, price });
      if (insErr) console.error(`Error inserting price for ${code}:`, insErr);
      else successCount++;
    } else {
      successCount++;
    }
  }
  
  console.log(`Updated/Inserted prices for ${successCount} products. Not found: ${notFoundCount}`);
}

run().catch(console.error);
