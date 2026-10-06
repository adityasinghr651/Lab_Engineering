// src/app.js
const express = require('express');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { getHealth } = require('./controllers/health.controller');

const app = express();

app.use(express.json());
app.use(requestLogger); // sabse pehle — har request log honi chahiye

app.get('/', (req, res) => {
  res.send('Welcome to DevFlow');
});

const { checkApiKey } = require('./middleware/authMiddleware');

app.get('/health', getHealth);

app.get('/admin/stats', checkApiKey, (req, res) => {
  res.json({ stats: 'secret data' });
});

app.get('/crash-test', (req, res, next) => {
  try {
    throw new Error('Intentional crash for testing');
  } catch (err) {
    next(err);
  }
});

// 404 handler — jab koi route match na ho
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler — SABSE END mein, 4 parameters wala
app.use(errorHandler);

module.exports = app;