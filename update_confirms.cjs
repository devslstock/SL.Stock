const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace window.confirm containing apagar/excluir/remover
  content = content.replace(/window\.confirm\(\s*['"]([^'"]*(?:apagar|excluir|remover)[^'"]*)['"]\s*\)/gi, (match, p1) => {
    if (p1.includes('não pode ser desfeita')) return match;
    return `window.confirm('${p1}. Esta ação não pode ser desfeita.')`;
  });

  content = content.replace(/window\.confirm\(\s*\`([^\`]*(?:apagar|excluir|remover)[^\`]*)\`\s*\)/gi, (match, p1) => {
    if (p1.includes('não pode ser desfeita')) return match;
    return `window.confirm(\`${p1}. Esta ação não pode ser desfeita.\`)`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Updated', file);
  }
});

console.log('Total files updated:', changedCount);
