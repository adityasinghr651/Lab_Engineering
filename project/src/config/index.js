// src/config/index.js
// Saari environment-based configuration ek jagah centralize ki

require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  appName: process.env.APP_NAME || 'DevFlow',
  nodeEnv: process.env.NODE_ENV || 'development',
};