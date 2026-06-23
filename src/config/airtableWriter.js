// src/config/airtableWriter.js
// Writes inspection rows into Airtable using the Airtable REST API.

const https = require('https');

function airtableRequest(tableName, fields) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ fields });
    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Airtable error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildExtinguisherFields(entry) {
  const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  return {
    'วันที่ตรวจสอบ': now,
    'ผู้ตรวจสอบ': entry.inspector || '',
    'ชนิดถังดับเพลิง': entry.pointId,
    'สถานที่/ห้อง': entry.location || '',
    'ตรวจสายยืด หัวฉีด ต้องไม่มีวัสดุอุดตัน ไม่แตก ไม่แบน': entry.criteria1,
    'ตรวจเช็คตัวถัง ต้องอยู่ในสภาพสมบูรณ์ ไม่เป็นสนิม': entry.criteria2,
    'ตรวจเช็คสภาพถัง ต้องไม่บุบ หรือบวม และไม่ขึ้นสนิม': entry.criteria3,
    'ตรวจเช็คเกจความดัน ต้องชี้อยู่ที่ช่องสีเขียว': entry.criteria4,
    'ตรวจเช็คซีลล็อกและสลัก ต้องไม่ขาดหรือหลุดหาย': entry.criteria5,
    'ตรวจเช็คพื้นที่โดยรอบด้านหน้า ต้องไม่มีสิ่งกีดขวาง': entry.criteria6,
    'หมายเหตุ': entry.remarks || '',
    'ลิงก์รูปภาพ': entry.photoLink || '',
  };
}

function buildCabinetFields(entry) {
  const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  return {
    'วันที่ตรวจสอบ': now,
    'ผู้ตรวจสอบ': entry.inspector || '',
    'รหัสอุปกรณ์': entry.pointId,
    'สถานที่/ห้อง': entry.location || '',
    'ตรวจเช็คสภาพสายฉีดน้ำ ต้องไม่รั่ว หรือขาด': entry.criteria1,
    'ตรวจเช็คสภาพหัวฉีดน้ำ ต้องไม่แตก ไม่อุดตัน ปรับฝอย-ลำตรง เปิด-ปิดได้': entry.criteria2,
    'ตรวจเช็ควาล์วและท่อส่งน้ำ ต้องไม่รั่ว ไม่ปารุด': entry.criteria3,
    'ตรวจเช็คหัวต่อสายฉีดน้ำและฝาครอบ ต้องเปิด-ปิดได้ง่าย ไม่ติดขัด': entry.criteria4,
    'ตรวจเช็คสภาพตู้ดับเพลิง ต้องไม่ปารุด บุบ หรือแตก และเปิด-ปิดได้ง่าย': entry.criteria5,
    'ตรวจเช็คพื้นที่โดยรอบด้านหน้า ต้องไม่มีสิ่งกีดขวาง': entry.criteria6,
    'หมายเหตุ': entry.remarks || '',
    'ลิงก์รูปภาพ': entry.photoLink || '',
  };
}

async function logExtinguisherCheck(entry) {
  const table = process.env.EXTINGUISHER_TABLE_NAME || 'ExtinguisherLog';
  return airtableRequest(table, buildExtinguisherFields(entry));
}

async function logCabinetCheck(entry) {
  const table = process.env.CABINET_TABLE_NAME || 'CabinetLog';
  return airtableRequest(table, buildCabinetFields(entry));
}

module.exports = { logExtinguisherCheck, logCabinetCheck };
