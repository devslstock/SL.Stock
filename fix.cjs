const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'SalesManagement', 'AdminOrderEdit.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The issue was that the strings in my previous script didn't perfectly match the source due to CRLF or formatting.
// I will use regex replacements to catch them regardless of exact whitespace.

// 1. Remove const isEditing = editingItemId === item.id
content = content.replace(/const isEditing = editingItemId === item\.id\s*/g, '');

// 2. Replace the <tr> tag
content = content.replace(/<tr key=\{item\.id\} className="hover:bg-muted\/30">/g, '<tr key={item.id} className="hover:bg-muted/30 cursor-pointer" onDoubleClick={() => isEditable && setEditingDetailItem(item)}>');

// 3. Replace the Actions column
const actionsRegex = /<td className="p-2 flex gap-1">[\s\S]*?<\/td>/;
const newActions = `<td className="p-2 flex gap-1">
                        {isEditable && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="text-red-500 hover:text-red-700" title="Excluir"><Trash2 className="h-4 w-4"/></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingDetailItem(item); }} className="text-orange-500 hover:text-orange-700" title="Editar Detalhes (Duplo Clique)"><Edit2 className="h-4 w-4"/></button>
                          </>
                        )}
                      </td>`;
content = content.replace(actionsRegex, newActions);

// 4. Replace quantity column
const qtyRegex = /<td className="p-2 text-right bg-amber-100 dark:bg-amber-900\/40 font-bold">[\s\S]*?<\/td>/;
const newQty = `<td className="p-2 text-right bg-amber-100 dark:bg-amber-900/40 font-bold">
                        {item.quantity.toFixed(4)}
                      </td>`;
content = content.replace(qtyRegex, newQty);

// 5. Replace unit price column
const priceRegex = /<td className="p-2 text-right">\s*\{isEditing \? \([\s\S]*?\)\s*:\s*\([\s\S]*?\)\s*\}\s*<\/td>/;
const newPrice = `<td className="p-2 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>`;
content = content.replace(priceRegex, newPrice);

// 6. Replace discount column
const discountRegex = /<td className="p-2 text-right">\s*\{isEditing \? \([\s\S]*?\)\s*:\s*\([\s\S]*?\)\s*\}\s*<\/td>/;
const newDiscount = `<td className="p-2 text-right">
                        {\`\${item.discount_percent || 0}%\`}
                      </td>`;
// Note: because replace() with regex without 'g' flag replaces the first match, I will replace unit price then discount sequentially, but they look identical structurally, so I have to be careful.
// Let's use a simpler regex for unit_price and discount specifically.
content = content.replace(/\{isEditing \? \([\s\S]*?<Input[\s\S]*?value=\{item\.unit_price\}[\s\S]*?:\s*\(\s*formatCurrency\(item\.unit_price\)\s*\)\s*\}/, '{formatCurrency(item.unit_price)}');

content = content.replace(/\{isEditing \? \([\s\S]*?<Input[\s\S]*?value=\{item\.discount_percent \|\| 0\}[\s\S]*?:\s*\(\s*`\$\{item\.discount_percent \|\| 0\}%`\s*\)\s*\}/, '{`${item.discount_percent || 0}%`}');


fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed AdminOrderEdit.tsx');

// Fix ItemDetailsModal.tsx
const modalPath = path.join('src', 'pages', 'SalesManagement', 'ItemDetailsModal.tsx');
let modalContent = fs.readFileSync(modalPath, 'utf8');
modalContent = modalContent.replace(/setFormData\(prev => \(/g, 'setFormData((prev: any) => (');
fs.writeFileSync(modalPath, modalContent, 'utf8');
console.log('Fixed ItemDetailsModal.tsx');
