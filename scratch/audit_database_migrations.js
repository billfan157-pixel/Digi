import fs from 'fs';
import path from 'path';

const migrationsDir = 'c:/DigiWell/supabase/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

const functions = []; // { name, file, isSecurityDefiner: boolean, hasSearchPath: boolean, hasRevoke: boolean }
const indexes = []; // { name, table, columns: string, file, isDrop: boolean }
const fks = []; // { table, columns: string, referencedTable, file }
const buckets = []; // any info about buckets

const fnDefRegex = /create(?:\s+or\s+replace)?\s+function\s+([a-zA-Z0-9_\.]+)\s*\(/gi;
const indexRegex = /create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_]+)\s+on\s+(?:only\s+)?([a-zA-Z0-9_\.]+)\s*\(([^)]+)\)/gi;
const dropIndexRegex = /drop\s+index\s+(?:if\s+exists\s+)?([a-zA-Z0-9_\.]+)/gi;
const fkRegex = /alter\s+table\s+(?:only\s+)?([a-zA-Z0-9_\.]+)\s+add\s+constraint\s+[a-zA-Z0-9_]+\s+foreign\s+key\s*\(([^)]+)\)\s*references\s+([a-zA-Z0-9_\.]+)/gi;
const fkInlineRegex = /([a-zA-Z0-9_]+)\s+[a-zA-Z0-9_]+\s+references\s+([a-zA-Z0-9_\.]+)/gi;

files.forEach(file => {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

  // 1. Audit functions
  let match;
  const fnRegex = /create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z0-9_\.]+)\s*\(/gi;
  while ((match = fnRegex.exec(content)) !== null) {
    const fnName = match[1];
    
    // Find the body or definition to check SECURITY DEFINER, search_path, and REVOKE
    // We search the content from the match index forward for 'security definer' and 'search_path'
    const subContent = content.slice(match.index, match.index + 2000);
    const isSecurityDefiner = /security\s+definer/i.test(subContent);
    const hasSearchPath = /set\s+search_path\s*=\s*|set\s+search_path\s+to\s+/i.test(subContent);
    
    // Check if there's a REVOKE for this function in the file
    const cleanFnName = fnName.replace('public.', '').toLowerCase();
    const revokeRegex = new RegExp(`revoke\\s+all\\s+on\\s+function\\s+(?:public\\.)?${cleanFnName}\\s*\\(`, 'i');
    const hasRevoke = revokeRegex.test(content);

    functions.push({ name: fnName, file, isSecurityDefiner, hasSearchPath, hasRevoke });
  }

  // 2. Audit indexes
  let idxMatch;
  const localIdxRegex = /create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_]+)\s+on\s+(?:only\s+)?([a-zA-Z0-9_\.]+)\s*\(([^)]+)\)/gi;
  while ((idxMatch = localIdxRegex.exec(content)) !== null) {
    const name = idxMatch[1];
    const table = idxMatch[2].replace('public.', '');
    const columns = idxMatch[3].replace(/\s+/g, '').toLowerCase();
    indexes.push({ name, table, columns, file, isDrop: false });
  }

  let dropIdxMatch;
  const localDropIdxRegex = /drop\s+index\s+(?:if\s+exists\s+)?([a-zA-Z0-9_]+)/gi;
  while ((dropIdxMatch = localDropIdxRegex.exec(content)) !== null) {
    const name = dropIdxMatch[1];
    indexes.push({ name, isDrop: true, file });
  }

  // 3. Audit foreign keys
  let fkMatch;
  const localFkRegex = /foreign\s+key\s*\(([^)]+)\)\s*references\s+(?:public\.)?([a-zA-Z0-9_]+)/gi;
  while ((fkMatch = localFkRegex.exec(content)) !== null) {
    const columns = fkMatch[1].replace(/\s+/g, '').toLowerCase();
    const refTable = fkMatch[2].toLowerCase();
    // Let's guess the table name by looking backwards for ALTER TABLE or CREATE TABLE
    const contextStr = content.slice(Math.max(0, fkMatch.index - 500), fkMatch.index);
    const tableMatch = /alter\s+table\s+(?:only\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i.exec(contextStr) ||
                       /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i.exec(contextStr);
    const table = tableMatch ? tableMatch[1] : 'unknown';
    fks.push({ table, columns, refTable, file });
  }

  // Inline references: "column_id uuid references public.profiles(id)"
  let inlineMatch;
  const localInlineFkRegex = /([a-zA-Z0-9_]+)\s+[a-zA-Z0-9_]+\s+references\s+(?:public\.)?([a-zA-Z0-9_]+)/gi;
  while ((inlineMatch = localInlineFkRegex.exec(content)) !== null) {
    const colName = inlineMatch[1];
    const refTable = inlineMatch[2];
    if (colName.toLowerCase() === 'references' || colName.toLowerCase() === 'key') continue;
    // Find table name
    const contextStr = content.slice(Math.max(0, inlineMatch.index - 500), inlineMatch.index);
    const tableMatch = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i.exec(contextStr);
    if (tableMatch) {
      fks.push({ table: tableMatch[1], columns: colName.toLowerCase(), refTable, file });
    }
  }

  // 4. Audit storage buckets
  if (content.toLowerCase().includes('insert into storage.buckets') || content.toLowerCase().includes('storage.buckets')) {
    buckets.push({ file, content: content.match(/insert\s+into\s+storage\.buckets[^\n]+/gi) });
  }
});

console.log('\n--- FUNCTIONS AUDIT ---');
functions.forEach(fn => {
  if (fn.isSecurityDefiner) {
    if (!fn.hasSearchPath || !fn.hasRevoke) {
      console.log(`Func: ${fn.name} (File: ${fn.file})`);
      console.log(`  - Has search_path: ${fn.hasSearchPath}`);
      console.log(`  - Has REVOKE from public/anon: ${fn.hasRevoke}`);
    }
  }
});

console.log('\n--- DUPLICATE INDEXES AUDIT ---');
// Trace active indexes (filter out dropped ones)
const activeIndexes = [];
const droppedIndexNames = new Set(indexes.filter(idx => idx.isDrop).map(idx => idx.name.toLowerCase()));
indexes.forEach(idx => {
  if (!idx.isDrop && !droppedIndexNames.has(idx.name.toLowerCase())) {
    activeIndexes.push(idx);
  }
});

// Group active indexes by table + columns signature to find duplicates
const indexGroups = {};
activeIndexes.forEach(idx => {
  const key = `${idx.table}:${idx.columns}`;
  if (!indexGroups[key]) indexGroups[key] = [];
  indexGroups[key].push(idx);
});

for (const [key, list] of Object.entries(indexGroups)) {
  if (list.length > 1) {
    console.log(`Duplicate Index Signature: ${key}`);
    list.forEach(idx => {
      console.log(`  - Index: ${idx.name} (File: ${idx.file})`);
    });
  }
}

console.log('\n--- UNINDEXED FOREIGN KEYS AUDIT ---');
// For each FK, check if there is an index starting with those columns on the same table
fks.forEach(fk => {
  if (fk.table === 'unknown') return;
  const hasIndex = activeIndexes.some(idx => {
    return idx.table.toLowerCase() === fk.table.toLowerCase() && 
           (idx.columns === fk.columns || idx.columns.startsWith(fk.columns + ','));
  });
  if (!hasIndex) {
    console.log(`FK Unindexed: ${fk.table}(${fk.columns}) -> references ${fk.refTable} (File: ${fk.file})`);
  }
});

console.log('\n--- STORAGE BUCKETS ---');
console.log(JSON.stringify(buckets, null, 2));
