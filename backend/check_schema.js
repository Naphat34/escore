const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:1234@localhost:5432/postgres',
  ssl: false
});

async function run() {
  try {
    await client.connect();
    const res = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'players';");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
