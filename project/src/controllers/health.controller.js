// src/controllers/health.controller.js
// Controller ab aur simple ho gaya — res.json() use kar rahe
function getHealth(req, res) {
  res.json({ status: 'ok' });
}

module.exports = { getHealth };