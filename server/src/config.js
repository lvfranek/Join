// @ts-check
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: Number(process.env.SERVER_PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    host: process.env.MARIADB_HOST || 'localhost',
    port: Number(process.env.MARIADB_PORT || 3306),
    user: process.env.MARIADB_USER || '',
    password: process.env.MARIADB_PASSWORD || '',
    database: process.env.MARIADB_DATABASE || '',
    connectionLimit: Number(process.env.MARIADB_CONNECTION_LIMIT || 10),
  },
};

if (!config.jwtSecret) {
  console.error('FATAL: JWT_SECRET is missing in .env');
  process.exit(1);
}

if (!config.db.user || !config.db.database) {
  console.error('FATAL: MARIADB_USER and MARIADB_DATABASE must be set in .env');
  process.exit(1);
}

module.exports = config;
