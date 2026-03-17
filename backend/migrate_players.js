// Fallback for local development if .env is missing or DATABASE_URL is empty
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://postgres:1234@localhost:5432/postgres';
}

const db = require('./config/db');

async function migrate() {
  try {
    console.log(`Starting migration using DATABASE_URL: ${process.env.DATABASE_URL}`);
    
    // Making first_name, last_name, and birth_date nullable in 'players' table
    await db.query('ALTER TABLE players ALTER COLUMN first_name DROP NOT NULL');
    await db.query('ALTER TABLE players ALTER COLUMN last_name DROP NOT NULL');
    await db.query('ALTER TABLE players ALTER COLUMN birth_date DROP NOT NULL');
    
    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
