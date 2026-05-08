// @ts-check
const mariadb = require('mariadb');
const config = require('./config');

const pool = mariadb.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  connectionLimit: config.db.connectionLimit,
  // Make BIGINT/JSON friendlier:
  bigIntAsNumber: true,
  // We store JSON columns as text and parse manually for consistency:
  // (mariadb driver returns JSON columns as strings by default)
});

async function query(sql, params = []) {
  const conn = await pool.getConnection();
  try {
    return await conn.query(sql, params);
  } finally {
    conn.release();
  }
}

module.exports = { pool, query };
