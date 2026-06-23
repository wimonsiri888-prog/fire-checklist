// src/config/sheetsWriter.js
// Writes inspection rows into a Google Sheet using the Google Sheets API v4.
// Uses a Service Account (JSON key file) for authentication — no user login needed.

const { google } = require('googleapis');
const path = require('path');

// หัวคอลัมน์ตรงกับใบ Checklist ตรวจถังดับเพลิงประจำเดือน (Dusit Princess)
const EXTINGUISHER_HEADERS = [
  'วันที่ตรวจสอบ',
  'ผู้ตรวจสอบ',
  'ชนิดถังดับเพลิง',
  'สถานที่/ห้อง',
  'ตรวจสายยืด หัวฉีด ต้องไม่มีวัสดุอุดตัน ไม่แตก ไม่แบน',
  'ตรวจเช็คตัวถังถัง ต้องอยู่ในสภาพสมบูรณ์ ไม่เป็นสนิม',
  'ตรวจเช็คสภาพของถังดับเพลิงต้องไม่บุบ หรือบวม และไม่ขึ้นสนิม',
  'ตรวจเช็คเกจความดันของถังดับเพลิง ต้องชี้อยู่ที่ช่องสีเขียว',
  'ตรวจเช็คซีลล็อก และสลัก ต้องไม่ขาดหรือหลุดหาย',
  'ตรวจเช็คพื้นที่โดยรอบด้านหน้าของถังดับเพลิงต้องไม่มีสิ่งกีดขวาง',
  'หมายเหตุ',
  'ลิงก์รูปภาพ',
];

const CABINET_HEADERS = [
  'วันที่ตรวจสอบ',
  'ผู้ตรวจสอบ',
  'รหัสอุปกรณ์',
  'สถานที่/ห้อง',
  'ตรวจเช็คสภาพสายฉีดน้ำ ต้องไม่รั่ว หรือขาด',
  'ตรวจเช็คสภาพหัวฉีดน้ำ ต้องไม่แตก ไม่อุดตัน ปรับฝอย-ลำตรง เปิด-ปิดได้',
  'ตรวจเช็ควาล์วและท่อส่งน้ำ ต้องไม่รั่ว ไม่ปารุด',
  'ตรวจเช็คหัวต่อสายฉีดน้ำและฝาครอบ ต้องเปิด-ปิด ได้ง่าย ไม่ติดขัด',
  'ตรวจเช็คสภาพตู้ดับเพลิง ต้องไม่ปารุด บุบ หรือแตก และเปิด-ปิดได้ง่าย',
  'ตรวจเช็คพื้นที่โดยรอบด้านหน้าของถังดับเพลิงต้องไม่มีสิ่งกีดขวาง',
  'หมายเหตุ',
  'ลิงก์รูปภาพ',
];

function getAuth() {
  return new google.auth.GoogleAuth({
    keyFile: path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

async function ensureHeaders(sheets, spreadsheetId, sheetName, headers) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:A1`,
  });
  const hasHeader = res.data.values && res.data.values.length > 0;
  if (!hasHeader) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
  }
}

async function appendRow(sheetName, headers, rowValues) {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  await ensureHeaders(sheets, spreadsheetId, sheetName, headers);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [rowValues] },
  });
}

function buildRow(entry) {
  const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  return [
    now,
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
}

async function logExtinguisherCheck(entry) {
  const sheetName = process.env.EXTINGUISHER_SHEET_NAME || 'ExtinguisherLog';
  return appendRow(sheetName, EXTINGUISHER_HEADERS, buildRow(entry));
}

async function logCabinetCheck(entry) {
  const sheetName = process.env.CABINET_SHEET_NAME || 'CabinetLog';
  return appendRow(sheetName, CABINET_HEADERS, buildRow(entry));
}

module.exports = { logExtinguisherCheck, logCabinetCheck };
