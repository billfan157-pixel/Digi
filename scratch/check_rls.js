import fs from 'fs';
import path from 'path';

const migrationsDir = 'c:/DigiWell/supabase/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

console.log(`Found ${files.length} migration files.`);

const tableToRls = new Map(); // table_name -> { file, hasRls: boolean }

files.forEach(file => {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  
  // Find all table names in CREATE TABLE
  const createTableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
  let match;
  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1].toLowerCase();
    if (!tableToRls.has(tableName)) {
      tableToRls.set(tableName, { file, hasRls: false });
    }
  }

  // Find all ALTER TABLE ... ENABLE ROW LEVEL SECURITY
  const rlsRegex = /alter\s+table\s+(?:only\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s+enable\s+row\s+level\s+security/gi;
  let rlsMatch;
  while ((rlsMatch = rlsRegex.exec(content)) !== null) {
    const tableName = rlsMatch[1].toLowerCase();
    const entry = tableToRls.get(tableName);
    if (entry) {
      entry.hasRls = true;
    } else {
      tableToRls.set(tableName, { file, hasRls: true });
    }
  }
});

console.log('--- TABLES WITHOUT RLS ---');
for (const [table, info] of tableToRls.entries()) {
  if (!info.hasRls) {
    console.log(`Table: ${table} (Created in: ${info.file})`);
  }
}
