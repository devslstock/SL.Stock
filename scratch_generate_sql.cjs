const fs = require('fs');

const csvPath = 'Itens (5).csv';
const sqlPath = 'supabase/migrations/20260817150000_update_products_taxes.sql';

const content = fs.readFileSync(csvPath, 'latin1');
const lines = content.split('\n');

const statements = [];

lines.forEach((line, index) => {
  if (index === 0 || !line.trim()) return; // skip header and empty lines

  const cols = line.split(';');
  const code = cols[0];
  const ncm = cols[26]?.replace(/\D/g, ''); // NCM digits only
  const ipi = cols[27];
  const cest = cols[39];
  const origin = cols[40] || cols[24]; // sometimes in 40, sometimes in 24

  if (!code) return;

  const extractPrice = (str) => {
    if (!str) return null;
    let match = str.match(/[\d.,]+/);
    if (!match) return null;
    return parseFloat(match[0].replace(/\./g, '').replace(',', '.'));
  };

  const minSalesPrice = extractPrice(cols[6]);
  const salesPrice = extractPrice(cols[7]);
  const purchasePrice = extractPrice(cols[11]);
  
  const updates = [];
  if (ncm) updates.push(`ncm = '${ncm}'`);
  if (cest) updates.push(`cest = '${cest}'`);
  if (origin) {
    let cleanOrigin = origin.replace(/'/g, "''").replace(/c.*digos/g, 'códigos');
    updates.push(`origin = '${cleanOrigin}'`);
  }
  if (minSalesPrice !== null) updates.push(`min_sales_price = ${minSalesPrice}`);
  if (salesPrice !== null) updates.push(`sales_price = ${salesPrice}`);
  if (purchasePrice !== null) updates.push(`purchase_price = ${purchasePrice}`);

  if (updates.length > 0) {
    statements.push(`UPDATE public.products SET ${updates.join(', ')} WHERE code = '${code}';`);
  }
});

const sqlContent = `-- Migration to update product taxes based on Maxiprod CSV export\n\n` + statements.join('\n');

fs.writeFileSync(sqlPath, sqlContent, 'utf8');
console.log(`Generated ${statements.length} updates in ${sqlPath}`);
