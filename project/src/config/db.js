// src/config/db.js
const { Pool } = require('pg');
const config = require('./index');

const connectionString =
  config.nodeEnv === 'test' ? config.databaseUrlTest : config.databaseUrl;

const pool = new Pool({
  connectionString,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

module.exports = pool;

