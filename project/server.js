// server.js — zyada kuch nahi badla
const app = require('./src/app');
const config = require('./src/config');
const { logMessage } = require('./src/utils/logger');

app.listen(config.port, () => {
  logMessage(`DevFlow running on port ${config.port}`);
});