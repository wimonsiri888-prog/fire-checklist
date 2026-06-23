// src/routes/checklist.js
const express = require('express');
const router = express.Router();
const { findPoint } = require('../config/pointsData');
const { logExtinguisherCheck, logCabinetCheck } = require('../config/airtableWriter');

const VALID_RESULTS = new Set(['ปกติ', 'ไม่ปกติ']);

function validateSubmission(body) {
  const errors = [];
  if (!body.pointId) errors.push('pointId is required');
  for (let i = 1; i <= 6; i++) {
    const key = `criteria${i}`;
    if (!VALID_RESULTS.has(body[key])) {
      errors.push(`${key} must be "ปกติ" or "ไม่ปกติ"`);
    }
  }
  return errors;
}

// POST /api/checklist/submit
router.post('/submit', async (req, res) => {
  const point = findPoint(req.body.pointId);
  if (!point) {
    return res.status(404).json({ error: 'Point ID not found' });
  }

  const errors = validateSubmission(req.body);
  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const entry = {
    pointId: req.body.pointId,
    location: point.location_th,
    inspector: req.body.inspector || req.headers['x-ms-client-principal-name'] || '',
    criteria1: req.body.criteria1,
    criteria2: req.body.criteria2,
    criteria3: req.body.criteria3,
    criteria4: req.body.criteria4,
    criteria5: req.body.criteria5,
    criteria6: req.body.criteria6,
    remarks: req.body.remarks || '',
    photoLink: req.body.photoLink || '',
  };

  try {
    if (point.type === 'extinguisher') {
      await logExtinguisherCheck(entry);
    } else {
      await logCabinetCheck(entry);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Excel write failed:', err.response?.data || err.message);
    res.status(502).json({
      error: 'Failed to write to Google Sheets. Check service account credentials.',
      details: err.message,
    });
  }
});

module.exports = router;
