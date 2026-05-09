const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (fullPath.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let changedFiles = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/<button([^>]*)rounded-2xl([^>]*)>/g, '<button$1rounded-xl$2>');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    changedFiles++;
    console.log(`Updated button radius in ${path.relative(__dirname, file)}`);
  }
});

console.log(`Changed ${changedFiles} files`);
