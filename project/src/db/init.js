// src/db/init.js
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function initDB() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('Initializing database schema...');
    await pool.query(schemaSql);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initDB()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initDB };

