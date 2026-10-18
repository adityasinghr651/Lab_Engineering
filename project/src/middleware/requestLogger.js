function requestLogger(req, res, next) {
  if (process.env.ENABLE_REQUEST_LOGGING === 'false') {
    return next();
  }
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} `);

  next();
}

module.exports = requestLogger;