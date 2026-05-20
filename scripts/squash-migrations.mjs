import { execSync } from 'node:child_process';
import { readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

async function squashMigrations() {
  console.log('🔄 Squashing migrations using Supabase CLI...');
  
  try {
    // Attempt to use the official supabase CLI squash command
    // This requires Docker to be running locally as it spins up a shadow database.
    execSync('npx supabase migration squash --local', { stdio: 'inherit' });
    console.log('✅ Migrations squashed successfully via Supabase CLI.');
    
    // Note: The CLI squash command creates a new squashed migration file
    // and automatically removes the squashed ones from the history, but might 
    // leave the old files on disk depending on the version. We can clean them up if needed.
    
  } catch (error) {
    console.error('❌ Failed to squash migrations. Please ensure Docker is running and the Supabase CLI is authenticated.');
    console.error(error.message);
    process.exit(1);
  }
}

squashMigrations();
