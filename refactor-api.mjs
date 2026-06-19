import fs from 'fs';
import path from 'path';

const apiDir = path.join(process.cwd(), 'src', 'api');
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(apiDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove import
  content = content.replace(/import\s*\{\s*currentCompanyId\s*\}\s*from\s*'@\/contexts\/AuthContext';?\n?/g, '');

  // 2. Remove early returns
  content = content.replace(/if\s*\(!currentCompanyId\)\s*return\s*\[\];?\n?/g, '');
  content = content.replace(/if\s*\(!currentCompanyId\)\s*return\s*null;?\n?/g, '');
  content = content.replace(/if\s*\(!currentCompanyId\)\s*throw\s*new\s*Error\([^)]+\);?\n?/g, '');
  
  // 3. Remove .eq('company_id', currentCompanyId)
  content = content.replace(/\.eq\('company_id',\s*currentCompanyId\)/g, '');

  // 4. Remove company_id from inserts (matches `company_id: currentCompanyId,` or without comma)
  content = content.replace(/company_id:\s*currentCompanyId,?\s*/g, '');

  // 5. Remove any leftover `, }` caused by trailing commas removed
  content = content.replace(/,\s*\}/g, '}');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${file}`);
}
