const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'SalesManagement', 'AdminOrderEdit.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The mobile view! I forgot the mobile view table!
// That's why it failed. There are TWO tables.
content = content.replace(/const isEditing = editingItemId === item\.id/g, '');
content = content.replace(/setEditingItemId\(null\)/g, 'setEditingDetailItem(null)');
content = content.replace(/setEditingItemId\(item\.id\)/g, 'setEditingDetailItem(item)');
content = content.replace(/isEditing \?/g, 'false ?'); // disable the conditional inputs

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed mobile view and everything else');
