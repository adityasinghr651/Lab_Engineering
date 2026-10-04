// src/controllers/health.controller.js
// Controller ka kaam: request aane par kya response dena hai, decide karna
// Abhi plain http module hai, isliye req/res manually handle kar rahe

function getHealth(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'ok' }));
}

module.exports = { getHealth };