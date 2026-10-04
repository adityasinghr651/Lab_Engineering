// src/routes/index.js
// Routing logic ek jagah — kis URL par kaunsa controller call hoga
// Abhi plain function hai (Express aane ke baad ye Router() object banega)

const { getHealth } = require('../controllers/health.controller');

function handleRequest(req, res) {
  if (req.url === '/health' && req.method === 'GET') {
    return getHealth(req, res);
  }

  if (req.url === '/' && req.method === 'GET') {
    res.statusCode = 200;
    res.end('Welcome to DevFlow');
    return;
  }

  // Koi bhi route match na ho toh 404
  res.statusCode = 404;
  res.end('Not Found');
}

module.exports = { handleRequest };