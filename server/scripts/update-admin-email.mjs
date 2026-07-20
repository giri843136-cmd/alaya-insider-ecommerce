import pg from 'pg';
const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  // Check current values
  const res = await client.query("SELECT key, value FROM settings WHERE key IN ('admin_email', 'admin_password', 'admin_phone')");
  for (const row of res.rows) {
    console.log(`${row.key} = ${row.value}`);
  }

  // Update admin email to the user's real email
  await client.query("UPDATE settings SET value = $1 WHERE key = 'admin_email'", ['alayainsider@gmail.com']);
  console.log('✅ admin_email updated to alayainsider@gmail.com');

  await client.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
