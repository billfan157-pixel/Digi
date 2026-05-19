import { readdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const assetsDir = path.resolve('dist/assets');
const maxGzipKb = Number(process.env.MAX_CHUNK_GZIP_KB ?? 130);
const warnGzipKb = Number(process.env.WARN_CHUNK_GZIP_KB ?? 90);

async function gzipSize(filePath) {
  let total = 0;
  const gzip = createGzip({ level: 9 });
  gzip.on('data', chunk => {
    total += chunk.length;
  });
  await pipeline(createReadStream(filePath), gzip);
  return total;
}

async function listAssets(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listAssets(fullPath));
    } else if (/\.(js|css)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const files = await listAssets(assetsDir);
  const rows = [];

  for (const filePath of files) {
    const fileStat = await stat(filePath);
    const gzBytes = await gzipSize(filePath);
    rows.push({
      file: path.relative(process.cwd(), filePath).replaceAll('\\', '/'),
      rawKb: fileStat.size / 1024,
      gzipKb: gzBytes / 1024,
    });
  }

  rows.sort((a, b) => b.gzipKb - a.gzipKb);

  const oversized = rows.filter(row => row.gzipKb > maxGzipKb);
  const warnings = rows.filter(row => row.gzipKb > warnGzipKb);

  console.log(`Build size guard: ${rows.length} JS/CSS assets checked.`);
  console.log(`Warn > ${warnGzipKb}KB gzip, fail > ${maxGzipKb}KB gzip.`);

  for (const row of warnings.slice(0, 10)) {
    const level = row.gzipKb > maxGzipKb ? 'FAIL' : 'WARN';
    console.log(`${level} ${row.file} ${row.gzipKb.toFixed(1)}KB gzip (${row.rawKb.toFixed(1)}KB raw)`);
  }

  if (oversized.length > 0) {
    throw new Error(`${oversized.length} build asset(s) exceed ${maxGzipKb}KB gzip.`);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
