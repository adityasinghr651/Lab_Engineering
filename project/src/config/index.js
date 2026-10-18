// src/config/index.js
// Saari environment-based configuration ek jagah centralize ki

require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  appName: process.env.APP_NAME || 'DevFlow',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/devflow',
  databaseUrlTest: process.env.DATABASE_URL_TEST || 'postgres://postgres:postgres@localhost:5432/devflow_test',
};