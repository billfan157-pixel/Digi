import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      getFiles(res, files);
    } else {
      files.push(res);
    }
  }
  return files;
}

function formatBytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB (${(bytes / 1024).toFixed(2)} KB)`;
}

function runAnalysis() {
  console.log('Analyzing bundle sizes in ./dist...');
  
  if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory does not exist. Please run npm run build first.');
    process.exit(1);
  }

  const allFiles = getFiles(distDir);
  const jsFiles = allFiles.filter(f => f.endsWith('.js'));

  let totalSize = 0;
  let hasViolation = false;

  console.log('\n--- JS Chunks ---');
  for (const file of jsFiles) {
    const relativePath = path.relative(distDir, file);
    const stats = fs.statSync(file);
    const size = stats.size;
    totalSize += size;

    console.log(`- ${relativePath}: ${formatBytes(size)}`);

    if (size > 800 * 1024) {
      console.error(`  ❌ VIOLATION: Single chunk is greater than 800 KB! Limit is 800 KB.`);
      hasViolation = true;
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Total JS Bundle Size: ${formatBytes(totalSize)}`);
  console.log(`Total JS Bundle Limit: 2.00 MB (2048 KB)`);

  if (totalSize > 2.0 * 1024 * 1024) {
    console.error(`❌ VIOLATION: Total JS bundle size exceeds 2.0 MB!`);
    hasViolation = true;
  }

  if (hasViolation) {
    console.error('\nBundle size verification FAILED.');
    process.exit(1);
  } else {
    console.log('\n✅ Bundle size verification PASSED.');
    process.exit(0);
  }
}

runAnalysis();
