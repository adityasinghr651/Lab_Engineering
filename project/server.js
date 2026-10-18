// server.js — zyada kuch nahi badla
const app = require('./src/app');
const config = require('./src/config');
const { logMessage } = require('./src/utils/logger');

app.listen(config.port, () => {
  logMessage(`DevFlow running on port ${config.port}`);
  console.log(`Server: http://localhost:${config.port}`);
  console.log(`Issues: http://localhost:${config.port}/issues`);
});