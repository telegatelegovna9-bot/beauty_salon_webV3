const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { initDb } = require('./db');

async function main() {
  console.log('🔄 Running database migration...');
  const db = await initDb();
  console.log('✅ Database migration completed successfully');
  console.log(`📁 Database location: ${path.resolve(process.env.DB_PATH || './data/beauty_salon.db')}`);
  process.exit(0);
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
