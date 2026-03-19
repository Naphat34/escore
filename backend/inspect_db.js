const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function check(ssl) {
  const pool = new Pool({
    connectionString,
    ssl: ssl ? { rejectUnauthorized: false } : false
  });

  try {
    console.log(`Checking with SSL=${ssl}...`);
    
    console.log("Checking columns...");
    const cols = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name = 'team_a_id' OR column_name = 'team_b_id'
    `);
    console.log("Columns found:", cols.rows);

    console.log("Checking triggers...");
    const triggers = await pool.query(`
      SELECT trigger_name, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE action_statement LIKE '%team_a_id%' OR action_statement LIKE '%team_b_id%'
    `);
    console.log("Triggers found:", triggers.rows);

    console.log("Checking views...");
    const views = await pool.query(`
      SELECT table_name, view_definition 
      FROM information_schema.views 
      WHERE view_definition LIKE '%team_a_id%' OR view_definition LIKE '%team_b_id%'
    `);
    console.log("Views found:", views.rows);

    console.log("Checking routines (functions/stored procedures)...");
    const routines = await pool.query(`
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_definition LIKE '%team_a_id%' OR routine_definition LIKE '%team_b_id%'
      AND routine_schema = 'public'
    `);
    console.log("Routines found:", routines.rows);

    return true;
  } catch (err) {
    console.error(`Error with SSL=${ssl}:`, err.message);
    return false;
  } finally {
    await pool.end();
  }
}

async function run() {
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  
  let success = await check(true);
  if (!success) {
    success = await check(false);
  }
  
  if (!success) {
    console.error("Could not connect to database");
    process.exit(1);
  }
}

run();
