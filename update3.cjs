const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'SalesManagement', 'AdminOrderEdit.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. the tr logic
const trOld = `              <tbody className="divide-y divide-border">
                {localItems.map((item: any, index) => {
                  const isEditing = editingItemId === item.id
                  return (
                    <tr key={item.id} className="hover:bg-muted/30">`;

const trNew = `              <tbody className="divide-y divide-border">
                {localItems.map((item: any, index) => {
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 cursor-pointer" onDoubleClick={() => setEditingDetailItem(item)}>`;
content = content.replace(trOld, trNew);

// 2. the Actions logic
const actionsOld = `                      <td className="p-2 flex gap-1">
                        {isEditing ? (
                          <button onClick={() => setEditingItemId(null)} className="text-green-600 hover:text-green-700" title="Confirmar Edição"><Check className="h-4 w-4"/></button>
                        ) : (
                          <>
                            {isEditable && (
                              <>
                                <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700" title="Excluir"><Trash2 className="h-4 w-4"/></button>
                                <button onClick={() => setEditingItemId(item.id)} className="text-orange-500 hover:text-orange-700" title="Editar"><Edit2 className="h-4 w-4"/></button>
                              </>
                            )}
                          </>
                        )}
                      </td>`;
const actionsNew = `                      <td className="p-2 flex gap-1">
                        {isEditable && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="text-red-500 hover:text-red-700" title="Excluir"><Trash2 className="h-4 w-4"/></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingDetailItem(item); }} className="text-orange-500 hover:text-orange-700" title="Editar Detalhes"><Edit2 className="h-4 w-4"/></button>
                          </>
                        )}
                      </td>`;
content = content.replace(actionsOld, actionsNew);

// 3. Replace the entire quantity, unit price, and discount logic safely.
// We'll just replace the whole block from "Editable Quantidade" to "Estado"
const tdBlockStart = `                      {/* Editable Quantidade */}`;
const tdBlockEnd = `                      <td className="p-2">`; // the next column (Estado)

const startIndex = content.indexOf(tdBlockStart);
const endIndex = content.indexOf(tdBlockEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newTdBlock = `                      {/* Editable Quantidade */}
                      <td className="p-2 text-right bg-amber-100 dark:bg-amber-900/40 font-bold">
                        {item.quantity.toFixed(4)}
                      </td>
                      <td className="p-2 text-muted-foreground">{item.product?.unit || 'un'}</td>
                      
                      {/* Editable Unit Price */}
                      <td className="p-2 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      
                      {/* Editable Discount */}
                      <td className="p-2 text-right">
                        {\`\${item.discount_percent || 0}%\`}
                      </td>
                      
                      {/* Total Line */}
                      <td className="p-2 text-right font-medium bg-amber-50 dark:bg-amber-950/20 text-emerald-700 dark:text-emerald-500">
                        {formatCurrency(item.total_price)}
                      </td>
                      
`;
  content = content.substring(0, startIndex) + newTdBlock + content.substring(endIndex);
}

// 4. Update the save logic to include tax fields
const oldSaveInsert = `            newItemsToInsert.push({
              sales_order_id: id!,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_percent: item.discount_percent || 0,
              total_price: item.total_price,
              net_price: item.total_price
            })`;
const newSaveInsert = `            newItemsToInsert.push({
              sales_order_id: id!,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_percent: item.discount_percent || 0,
              total_price: item.total_price,
              net_price: item.total_price,
              cfop: item.cfop, csosn: item.csosn, cst: item.cst, icms_rate: item.icms_rate, pis_cst: item.pis_cst, pis_rate: item.pis_rate, cofins_cst: item.cofins_cst, cofins_rate: item.cofins_rate, ipi_rate: item.ipi_rate, ncm: item.ncm, cest: item.cest, origin: item.origin
            })`;
content = content.replace(oldSaveInsert, newSaveInsert);

const oldSaveUpdate = `            await salesApi.updateSalesOrderItem(item.id, {
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_percent: item.discount_percent || 0,
              total_price: item.total_price,
              net_price: item.total_price
            })`;
const newSaveUpdate = `            await salesApi.updateSalesOrderItem(item.id, {
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_percent: item.discount_percent || 0,
              total_price: item.total_price,
              net_price: item.total_price,
              cfop: item.cfop, csosn: item.csosn, cst: item.cst, icms_rate: item.icms_rate, pis_cst: item.pis_cst, pis_rate: item.pis_rate, cofins_cst: item.cofins_cst, cofins_rate: item.cofins_rate, ipi_rate: item.ipi_rate, ncm: item.ncm, cest: item.cest, origin: item.origin
            })`;
content = content.replace(oldSaveUpdate, newSaveUpdate);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed syntax and restored properly.');
