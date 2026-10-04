// server.js (root level)
// Sirf server start karne ka kaam — koi business logic nahi

const app = require('./src/app');
const config = require('./src/config');
const { logMessage } = require('./src/utils/logger');

app.listen(config.port, () => {
  logMessage(`${config.appName} running on port ${config.port} [${config.nodeEnv}]`);
});