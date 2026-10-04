const { logMessage } = require('../utils/logger');

const loggerMiddleware = (req, res, next) => {
  logMessage(`Incoming Request: ${req.method} ${req.url}`);
  next();
};

module.exports = loggerMiddleware;
