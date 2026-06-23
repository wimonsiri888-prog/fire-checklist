// src/config/pointsData.js
// Loads the fixed-location point lists (extinguishers + cabinets) from CSV
// so the form can show the correct location name for a scanned QR Point ID.

const fs = require('fs');
const path = require('path');

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  const [headerLine, ...lines] = raw.split('\n');
  const headers = headerLine.split(',');
  return lines.map((line) => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] || '').trim();
    });
    return row;
  });
}

const extinguishers = parseCsv(path.join(__dirname, '../../data/extinguishers.csv'));
const cabinets = parseCsv(path.join(__dirname, '../../data/cabinets.csv'));

const extinguisherMap = new Map(extinguishers.map((r) => [r.point_id, r]));
const cabinetMap = new Map(cabinets.map((r) => [r.point_id, r]));

function findPoint(pointId) {
  if (extinguisherMap.has(pointId)) {
    return { type: 'extinguisher', ...extinguisherMap.get(pointId) };
  }
  if (cabinetMap.has(pointId)) {
    return { type: 'cabinet', ...cabinetMap.get(pointId) };
  }
  return null;
}

module.exports = { extinguishers, cabinets, findPoint };
