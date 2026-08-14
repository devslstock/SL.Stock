const fs = require('fs');
const Papa = require('papaparse');

const csvPath = 'C:\\Users\\lucas\\OneDrive\\Projeto IA\\SL Stock\\Operações fiscais.csv';
const content = fs.readFileSync(csvPath, 'utf8');

const results = Papa.parse(content, {
  header: true,
  skipEmptyLines: true,
  delimiter: ';'
});

let sql = `-- Migration to import fiscal operations\n\n`;

for (const row of results.data) {
  if (!row['Código'] || !row['Descrição']) continue;

  const code = (row['Código'] || '').trim().replace(/'/g, "''");
  const name = (row['Descrição'] || '').trim().replace(/'/g, "''");
  const nature_of_operation = (row['Natureza da operação'] || '').trim().replace(/'/g, "''");
  const cfop_intra = (row['CFOP'] || '').trim().replace(/'/g, "''");
  const active = row['Ativa'] === 'Sim' ? 'true' : 'false';
  const with_payment = row['Com pagamento'] === 'Sim' ? 'true' : 'false';
  const move_stock = row['Movimentar estoque'] === 'Sim' ? 'true' : 'false';
  const stock_origin = (row['Origem movimentação'] || '').trim().replace(/'/g, "''");
  const stock_destination = (row['Destino movimentação'] || '').trim().replace(/'/g, "''");
  const payment_debit_account = (row['Com pagamento (conta débito/crédito)'] || '').trim().replace(/'/g, "''");
  const cst = (row['CST ICMS'] || '').trim().replace(/'/g, "''");

  sql += `
INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '${code}', '${name}', '${name}', '${nature_of_operation}', '${cfop_intra}', '', ${active},
  ${with_payment}, ${move_stock}, '${stock_origin}', '${stock_destination}', '${payment_debit_account}', '${cst}'
);
`;
}

fs.writeFileSync('import_cfop.sql', sql);
console.log('SQL generated to import_cfop.sql');
