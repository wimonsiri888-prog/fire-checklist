// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const pointsRoute = require('./routes/points');
const checklistRoute = require('./routes/checklist');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/points', pointsRoute);
app.use('/api/checklist', checklistRoute);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Fallback to the SPA for any non-API route (so /check?id=EXT-01 loads the app)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Fire safety checklist app running on http://localhost:${PORT}`);
});
