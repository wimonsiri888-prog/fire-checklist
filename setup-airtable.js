// setup-airtable.js
// รันครั้งเดียวเพื่อสร้างคอลัมน์ใน Airtable
// คำสั่ง: node setup-airtable.js

require('dotenv').config();
const https = require('https');

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

const EXTINGUISHER_FIELDS = [
  { name: 'วันที่ตรวจสอบ', type: 'singleLineText' },
  { name: 'ผู้ตรวจสอบ', type: 'singleLineText' },
  { name: 'ชนิดถังดับเพลิง', type: 'singleLineText' },
  { name: 'สถานที่/ห้อง', type: 'singleLineText' },
  { name: 'ตรวจสายยืด หัวฉีด ต้องไม่มีวัสดุอุดตัน ไม่แตก ไม่แบน', type: 'singleLineText' },
  { name: 'ตรวจเช็คตัวถัง ต้องอยู่ในสภาพสมบูรณ์ ไม่เป็นสนิม', type: 'singleLineText' },
  { name: 'ตรวจเช็คสภาพถัง ต้องไม่บุบ หรือบวม และไม่ขึ้นสนิม', type: 'singleLineText' },
  { name: 'ตรวจเช็คเกจความดัน ต้องชี้อยู่ที่ช่องสีเขียว', type: 'singleLineText' },
  { name: 'ตรวจเช็คซีลล็อกและสลัก ต้องไม่ขาดหรือหลุดหาย', type: 'singleLineText' },
  { name: 'ตรวจเช็คพื้นที่โดยรอบด้านหน้า ต้องไม่มีสิ่งกีดขวาง', type: 'singleLineText' },
  { name: 'หมายเหตุ', type: 'multilineText' },
  { name: 'ลิงก์รูปภาพ', type: 'url' },
];

const CABINET_FIELDS = [
  { name: 'วันที่ตรวจสอบ', type: 'singleLineText' },
  { name: 'ผู้ตรวจสอบ', type: 'singleLineText' },
  { name: 'รหัสอุปกรณ์', type: 'singleLineText' },
  { name: 'สถานที่/ห้อง', type: 'singleLineText' },
  { name: 'ตรวจเช็คสภาพสายฉีดน้ำ ต้องไม่รั่ว หรือขาด', type: 'singleLineText' },
  { name: 'ตรวจเช็คสภาพหัวฉีดน้ำ ต้องไม่แตก ไม่อุดตัน ปรับฝอย-ลำตรง เปิด-ปิดได้', type: 'singleLineText' },
  { name: 'ตรวจเช็ควาล์วและท่อส่งน้ำ ต้องไม่รั่ว ไม่ปารุด', type: 'singleLineText' },
  { name: 'ตรวจเช็คหัวต่อสายฉีดน้ำและฝาครอบ ต้องเปิด-ปิดได้ง่าย ไม่ติดขัด', type: 'singleLineText' },
  { name: 'ตรวจเช็คสภาพตู้ดับเพลิง ต้องไม่ปารุด บุบ หรือแตก และเปิด-ปิดได้ง่าย', type: 'singleLineText' },
  { name: 'ตรวจเช็คพื้นที่โดยรอบด้านหน้า ต้องไม่มีสิ่งกีดขวาง', type: 'singleLineText' },
  { name: 'หมายเหตุ', type: 'multilineText' },
  { name: 'ลิงก์รูปภาพ', type: 'url' },
];

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.airtable.com',
      path,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(bodyStr && { 'Content-Length': Buffer.byteLength(bodyStr) }),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function getTableId(tableName) {
  const res = await apiRequest('GET', `/v0/meta/bases/${BASE_ID}/tables`);
  const table = res.data.tables.find((t) => t.name === tableName);
  return table ? { id: table.id, existingFields: table.fields.map((f) => f.name) } : null;
}

async function createFields(tableId, existingFields, fields) {
  for (const field of fields) {
    if (existingFields.includes(field.name)) {
      console.log(`  ✓ มีอยู่แล้ว: ${field.name}`);
      continue;
    }
    const res = await apiRequest('POST', `/v0/meta/bases/${BASE_ID}/tables/${tableId}/fields`, field);
    if (res.status === 200 || res.status === 201) {
      console.log(`  + สร้างแล้ว: ${field.name}`);
    } else {
      console.log(`  ✗ ผิดพลาด: ${field.name} — ${JSON.stringify(res.data)}`);
    }
  }
}

async function main() {
  console.log('เริ่มตั้งค่า Airtable...\n');

  console.log('📋 ExtinguisherLog');
  const ext = await getTableId('ExtinguisherLog');
  if (!ext) { console.log('ไม่พบ table ExtinguisherLog'); return; }
  await createFields(ext.id, ext.existingFields, EXTINGUISHER_FIELDS);

  console.log('\n📋 CabinetLog');
  const cab = await getTableId('CabinetLog');
  if (!cab) { console.log('ไม่พบ table CabinetLog'); return; }
  await createFields(cab.id, cab.existingFields, CABINET_FIELDS);

  console.log('\n✅ เสร็จแล้ว! ตอนนี้รัน npm start แล้วทดสอบได้เลย');
}

main().catch(console.error);
