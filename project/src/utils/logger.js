const config = require('../config');

function logMessage(message) {
  if (config.logLevel !== 'error') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
}

module.exports = { logMessage };
