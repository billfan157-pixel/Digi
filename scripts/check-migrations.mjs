import { readdirSync, statSync, readFileSync } from 'node:fs';
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

  // Read content and check for destructive changes
  const content = readFileSync(join(migrationsDir, file), 'utf8');
  const hasBypass = /--\s*allow-destructive-change\s*:/i.test(content);

  if (hasBypass) {
    console.log(`⚠️  Bypassed destructive change check for: ${file}`);
  } else {
    // Strip comments to avoid false positives in text/comments
    const cleanedContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // strip block comments
      .replace(/--.*$/gm, '');          // strip line comments

    // 1. Check for DROP COLUMN
    if (/\bdrop\s+column\b/i.test(cleanedContent)) {
      errors.push(`${file}: contains potentially destructive action 'DROP COLUMN'. Use a bypass comment '-- allow-destructive-change: [reason]' if intended.`);
    }

    // 2. Check for TRUNCATE
    if (/\btruncate\b/i.test(cleanedContent)) {
      errors.push(`${file}: contains potentially destructive action 'TRUNCATE'. Use a bypass comment '-- allow-destructive-change: [reason]' if intended.`);
    }

    // 3. Check for DROP TABLE
    const dropTableMatches = [...cleanedContent.matchAll(/\bdrop\s+table\s+(?:if\s+exists\s+)?([\w"._]+)/gi)];
    for (const dropMatch of dropTableMatches) {
      const tableName = dropMatch[1].toLowerCase();
      const isTempOrOld = tableName.includes('temp') || tableName.includes('_old');
      if (!isTempOrOld) {
        errors.push(`${file}: contains potentially destructive action 'DROP TABLE' on non-temporary/old table '${dropMatch[1]}'. Use a bypass comment '-- allow-destructive-change: [reason]' if intended.`);
      }
    }
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
