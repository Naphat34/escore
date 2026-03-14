const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:1234@localhost:5432/postgres',
  ssl: false
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'match_events';");
  console.log(res.rows);
  await client.end();
}
run();
