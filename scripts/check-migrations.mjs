import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

const errors = [];
const warnings = [];

const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

for (const file of files) {
  const base = file.replace(/\.sql$/, '');

  // Check naming convention: YYYYMMDDHHMMSS_description.sql (or YYYYMMDD_description for legacy)
  const match = base.match(/^(\d{8,14})_(.+)$/);
  if (!match) {
    errors.push(`${file}: filename must match YYYYMMDDHHMMSS_description.sql`);
    continue;
  }

  const timestamp = match[1];
  const description = match[2];

  // Check description is not empty
  if (!description) {
    errors.push(`${file}: description part is empty`);
  }

  // Warn if using legacy 8-digit format
  if (timestamp.length < 14) {
    warnings.push(`${file}: uses 8-digit format (YYYYMMDD) — prefer 14-digit (YYYYMMDDHHMMSS)`);
  }

  // Check description uses lowercase + hyphens/underscores only
  if (!/^[a-z0-9_-]+$/.test(description) && description.length > 0) {
    warnings.push(`${file}: description should use lowercase + hyphens/underscores (got "${description}")`);
  }

  // Check version (first 14 digits) is unique across files
  const versionKey = timestamp.padEnd(14, '0').slice(0, 14);
  const versionCount = files.filter(f => f.startsWith(versionKey)).length;
  if (versionCount > 1) {
    errors.push(`version ${versionKey} appears in ${versionCount} files — duplicate version detected`);
  }
}

// Check for duplicate content (same file size heuristic)
const sizeMap = new Map();
for (const file of files) {
  const size = statSync(join(migrationsDir, file)).size;
  const list = sizeMap.get(size) ?? [];
  list.push(file);
  sizeMap.set(size, list);
}
for (const [size, sameSizeFiles] of sizeMap) {
  if (sameSizeFiles.length > 1) {
    warnings.push(`${sameSizeFiles.join(', ')}: same size (${size} bytes) — possible duplicate content`);
  }
}

if (errors.length > 0) {
  console.error(`\n❌ Migration lint found ${errors.length} error(s):`);
  for (const err of errors) {
    console.error(`  • ${err}`);
  }
}

if (warnings.length > 0) {
  console.log(`\n⚠️  Migration lint found ${warnings.length} warning(s):`);
  for (const w of warnings) {
    console.log(`  • ${w}`);
  }
}

if (errors.length === 0) {
  console.log(`\n✅ Migration lint passed — ${files.length} files checked.`);
}

process.exit(errors.length > 0 ? 1 : 0);
