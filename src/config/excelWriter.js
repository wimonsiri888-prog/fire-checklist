// src/config/excelWriter.js
// Writes inspection rows into an Excel Table inside a file hosted on
// OneDrive/SharePoint, using the Microsoft Graph "workbook" API.
//
// Prerequisite: the target worksheet must contain a named Excel Table
// (Insert > Table in Excel) whose columns match the row shape below.
// This lets us use the addRow Graph endpoint instead of raw cell ranges,
// which is far less likely to corrupt formatting or collide with formulas.

const axios = require('axios');
const { getAccessToken } = require('./graphAuth');

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

async function appendRowToTable(tableName, rowValues) {
  const token = await getAccessToken();
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  const fileId = process.env.SHAREPOINT_FILE_ID;

  const url = `${GRAPH_BASE}/drives/${driveId}/items/${fileId}/workbook/tables/${tableName}/rows/add`;

  const response = await axios.post(
    url,
    { values: [rowValues] },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

/**
 * Appends one extinguisher inspection result.
 * Column order MUST match the ExtinguisherLog table headers in Excel:
 * [Submission Date, Inspector, Point ID, Location, C1..C6, Remarks, Photo Link]
 */
async function logExtinguisherCheck(entry) {
  const row = [
    new Date().toISOString(),
    entry.inspector || '',
    entry.pointId,
    entry.location || '',
    entry.criteria1,
    entry.criteria2,
    entry.criteria3,
    entry.criteria4,
    entry.criteria5,
    entry.criteria6,
    entry.remarks || '',
    entry.photoLink || '',
  ];
  return appendRowToTable(process.env.EXTINGUISHER_TABLE_NAME, row);
}

/**
 * Appends one fire cabinet inspection result.
 * Same column shape as above, different table.
 */
async function logCabinetCheck(entry) {
  const row = [
    new Date().toISOString(),
    entry.inspector || '',
    entry.pointId,
    entry.location || '',
    entry.criteria1,
    entry.criteria2,
    entry.criteria3,
    entry.criteria4,
    entry.criteria5,
    entry.criteria6,
    entry.remarks || '',
    entry.photoLink || '',
  ];
  return appendRowToTable(process.env.CABINET_TABLE_NAME, row);
}

module.exports = { logExtinguisherCheck, logCabinetCheck };
