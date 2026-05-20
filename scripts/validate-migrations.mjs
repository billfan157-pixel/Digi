import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

const errors = [];
const warnings = [];

const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

// Track defined functions across all files to detect duplicates
const definedFunctions = new Map(); // functionName -> [file1, file2]

for (const file of files) {
  const base = file.replace(/\.sql$/, '');

  // 1. Check naming convention: YYYYMMDDHHMMSS_action_entity.sql
  // Action can be: create, add, drop, alter, remove, fix, update, etc.
  const match = base.match(/^(\d{14})_([a-z0-9]+(?:_[a-z0-9]+)*)$/);
  if (!match) {
    if (base.match(/^\d{8}_/)) {
      warnings.push(`${file}: uses legacy 8-digit timestamp — MUST be YYYYMMDDHHMMSS_action_entity.sql`);
    } else {
      errors.push(`${file}: filename MUST match YYYYMMDDHHMMSS_action_entity.sql (lowercase, underscores)`);
    }
  } else {
    const timestamp = match[1];
    // Check version is unique
    const versionCount = files.filter(f => f.startsWith(timestamp)).length;
    if (versionCount > 1) {
      errors.push(`Version timestamp ${timestamp} appears in ${versionCount} files — duplicate version detected`);
    }
  }

  // Read file content for AST/RegEx analysis
  const content = readFileSync(join(migrationsDir, file), 'utf8');

  // 2. Parse functions
  // A simple heuristic using regex
  const functionRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\s*\(/gi;
  let funcMatch;
  
  while ((funcMatch = functionRegex.exec(content)) !== null) {
    const funcName = funcMatch[1].toLowerCase();
    
    // Store for duplicate detection
    if (!definedFunctions.has(funcName)) {
      definedFunctions.set(funcName, []);
    }
    definedFunctions.get(funcName).push(file);

    // Extract the function body roughly (from CREATE to the next ;)
    const startIdx = funcMatch.index;
    const endIdx = content.indexOf('LANGUAGE', startIdx) + 500; // rough end
    const funcBody = content.slice(startIdx, endIdx > content.length ? content.length : endIdx).toLowerCase();

    // 3. Security Checks for functions
    const isSecurityDefiner = funcBody.includes('security definer');
    
    if (isSecurityDefiner) {
      // Must set search_path
      if (!funcBody.includes('set search_path')) {
        errors.push(`${file}: Function '${funcName}' is SECURITY DEFINER but missing SET search_path = public`);
      }
    }

    // 4. Missing REVOKE checking (just check if file contains REVOKE for this function)
    const revokeRegex = new RegExp(`REVOKE\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+(?:[a-zA-Z0-9_]+\\.)?${funcName}\\b`, 'i');
    if (!revokeRegex.test(content) && !content.includes('REVOKE ALL ON FUNCTION')) {
      warnings.push(`${file}: Function '${funcName}' might be missing REVOKE EXECUTE FROM PUBLIC/anon`);
    }

    // 5. Auth.uid() check
    if (isSecurityDefiner && !content.toLowerCase().includes('auth.uid()') && !funcName.includes('webhook') && !funcName.includes('cron')) {
      warnings.push(`${file}: SECURITY DEFINER function '${funcName}' does not use auth.uid() — verify authorization`);
    }
  }
}

// Evaluate duplicates
for (const [funcName, defFiles] of definedFunctions) {
  if (defFiles.length > 1) {
    warnings.push(`Function '${funcName}' is defined multiple times in: ${defFiles.join(', ')}`);
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
