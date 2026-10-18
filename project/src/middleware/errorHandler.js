function errorHandler(err, req, res, next) {
  console.error('Error caught:', err.message);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
