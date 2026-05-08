// @ts-check
const bcrypt = require('bcryptjs');
const { query, pool } = require('./db');

const ADMIN_EMAIL = 'admin@demo-join.local';
const ADMIN_PASSWORD = 'DemoAdmin123456!';

async function main() {
  const existing = await query('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);
  if (existing.length > 0) {
    console.log(`✓ Admin already exists (id=${existing[0].id})`);
  } else {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await query('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)', [
      ADMIN_EMAIL,
      hash,
      'Demo Admin',
      'admin',
    ]);
    console.log(`✓ Admin user created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
