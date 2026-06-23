// src/routes/points.js
const express = require('express');
const router = express.Router();
const { findPoint } = require('../config/pointsData');

// GET /api/points/:pointId  -> returns location info + which checklist type to render
router.get('/:pointId', (req, res) => {
  const point = findPoint(req.params.pointId);
  if (!point) {
    return res.status(404).json({ error: 'Point ID not found' });
  }
  res.json(point);
});

module.exports = router;
