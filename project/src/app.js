const express = require('express');
const config = require('./config');
const routes = require('./routes');
const loggerMiddleware = require('./middleware/loggerMiddleware');

const app = express();

// Middlewares
app.use(express.json());
app.use(loggerMiddleware);

// Routes
app.use('/', routes);

module.exports = app;
