// src/utils/logger.js
// Lab 03 wala logger, yahan proper jagah par shift kiya

function logMessage(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

module.exports = { logMessage };