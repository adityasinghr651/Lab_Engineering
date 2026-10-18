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

const { authenticate, authorize } = require('./middleware/auth.middleware');

app.get('/health', getHealth);

// Admin stats protected by standard JWT authentication & admin authorization
app.get('/admin/stats', authenticate, authorize('admin'), (req, res) => {
  res.json({ stats: 'system operational' });
});

// crash-test is strictly disabled in production
if (process.env.NODE_ENV !== 'production') {
  app.get('/crash-test', (req, res, next) => {
    try {
      throw new Error('Intentional crash for testing');
    } catch (err) {
      next(err);
    }
  });
}

// Auth routes
const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);

// Project routes
const projectRoutes = require('./routes/project.routes');
app.use('/projects', projectRoutes);

// Issues routes
const issueRoutes = require('./routes/issue.routes');
app.use('/issues', issueRoutes);

// 404 handler — jab koi route match na ho
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler — SABSE END mein, 4 parameters wala
app.use(errorHandler);

module.exports = app;