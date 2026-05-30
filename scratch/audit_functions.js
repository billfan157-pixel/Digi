import fs from 'fs';
import path from 'path';

const migrationsDir = 'c:/DigiWell/supabase/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

const functions = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

  let match;
  // Match CREATE FUNCTION
  const fnRegex = /create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z0-9_\.]+)\s*\(/gi;
  while ((match = fnRegex.exec(content)) !== null) {
    const fnName = match[1];
    const subContent = content.slice(match.index, match.index + 2000);
    const isSecurityDefiner = /security\s+definer/i.test(subContent);
    const hasSearchPath = /set\s+search_path\s*=\s*|set\s+search_path\s+to\s+/i.test(subContent);
    
    const cleanFnName = fnName.replace('public.', '').toLowerCase();
    const revokeRegex = new RegExp(`revoke\\s+all\\s+on\\s+function\\s+(?:public\\.)?${cleanFnName}\\s*\\(`, 'i');
    const hasRevoke = revokeRegex.test(content);

    functions.push({ name: fnName, file, isSecurityDefiner, hasSearchPath, hasRevoke });
  }
});

console.log('--- SECURITY DEFINER FUNCTIONS MISSING search_path OR REVOKE ---');
functions.forEach(fn => {
  if (fn.isSecurityDefiner) {
    if (!fn.hasSearchPath || !fn.hasRevoke) {
      console.log(`Func: ${fn.name} (File: ${fn.file})`);
      console.log(`  - Has search_path: ${fn.hasSearchPath}`);
      console.log(`  - Has REVOKE from public/anon: ${fn.hasRevoke}`);
    }
  }
});
