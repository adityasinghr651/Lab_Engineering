// src/app.js
const express = require('express');
const { getHealth } = require('./controllers/health.controller');

const app = express();

app.use(express.json()); // body parsing ke liye

app.get('/', (req, res) => {
  res.send('Welcome to DevFlow');
});

app.get('/health', getHealth); // ab controller function seedha pass kar sakte hain

app.get('/info', (req, res) => {
  res.json({ app: 'DevFlow', version: '1.0.0', uptime: process.uptime() });
});

app.get('/users/:id/profile', (req, res) => {
  res.json({ userId: req.params.id, profile: 'placeholder' });
});

app.post('/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ name, email });
});

// Agar koi route match na ho, Express automatically ek default 404 bhejta hai —
// lekin hum apna custom 404 bhi likh sakte hain sabse end mein:
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;