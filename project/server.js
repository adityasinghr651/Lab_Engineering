// server.js — zyada kuch nahi badla
const app = require('./src/app');
const config = require('./src/config');
const { logMessage } = require('./src/utils/logger');

const pool = require('./src/config/db');

const server = app.listen(config.port, () => {
  logMessage(`DevFlow running on port ${config.port}`);
  console.log(`Server: http://localhost:${config.port}`);
  console.log(`Issues: http://localhost:${config.port}/issues`);
});

async function gracefulShutdown(signal) {
  logMessage(`Received ${signal}. Closing server and database connections...`);
  server.close(async (err) => {
    if (err) {
      console.error('Error during HTTP server shutdown:', err);
    }
    try {
      await pool.end();
      logMessage('Database connection pool closed.');
    } catch (dbErr) {
      console.error('Error closing database pool:', dbErr);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));