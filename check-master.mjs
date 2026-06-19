import fs from 'fs'; const content = fs.readFileSync('src/pages/Master/index.tsx', 'utf-8'); console.log(content.includes('exitCompany'));
