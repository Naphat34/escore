const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log("Starting migration...");
        const sqlPath = path.join(__dirname, 'migrations', '01_add_official_columns.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await db.query(sql);
        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

runMigration();
