// src/config/index.js
require('dotenv').config();

const INSECURE_DEFAULT_JWT_SECRET = 'devflow-default-jwt-secret-key-change-in-prod';
const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || INSECURE_DEFAULT_JWT_SECRET;

// Fail fast in production mode if JWT_SECRET is unset or uses the insecure fallback
if (nodeEnv === 'production') {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === INSECURE_DEFAULT_JWT_SECRET ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: In production mode, JWT_SECRET must be explicitly set to a cryptographically secure key of at least 32 characters.'
    );
  }
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  appName: process.env.APP_NAME || 'DevFlow',
  nodeEnv,
  logLevel: process.env.LOG_LEVEL || 'info',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/devflow',
  databaseUrlTest: process.env.DATABASE_URL_TEST || 'postgres://postgres:postgres@localhost:5432/devflow_test',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  dbPoolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
  dbIdleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  dbConnectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '5000', 10),
};