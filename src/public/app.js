// src/public/app.js

const EXT_CRITERIA = [
  'ตรวจสายฉีด หัวฉีด ต้องไม่มีวัสดุอุดตัน ไม่แตก ไม่แบน',
  'ตรวจเปิดตู้บังคับ ต้องอยู่ในสภาพสมบูรณ์ ไม่เป็นสนิม',
  'ตรวจเปิดสภาพของถังดับเพลิงต้องไม่บุบ หรือบวม และไม่ขึ้นสนิม',
  'ตรวจเปิดเกจความดันของถังดับเพลิง ต้องชี้อยู่ที่ช่องสีเขียว',
  'ตรวจเปิดสลักล็อก และสลัก ต้องไม่ขาดหรือหลุดหาย',
  'ตรวจเปิดพื้นที่โดยรอบด้านหน้าของถังดับเพลิงต้องไม่มีสิ่งกีดขวาง',
];

const CAB_CRITERIA = [
  'ตรวจเปิดสภาพสายฉีดน้ำ ต้องไม่รั่ว หรือขาด',
  'ตรวจเปิดสภาพหัวฉีดน้ำ ต้องไม่แตก ไม่อุดตัน ปรับฝอย-ลำตรง เปิด-ปิดได้',
  'ตรวจเปิดวาล์วและท่อส่งน้ำ ต้องไม่รั่ว ไม่ชำรุด',
  'ตรวจเปิดหัวต่อสายฉีดน้ำและฝาครอบ ต้องเปิด-ปิด ได้ง่าย ไม่ติดขัด',
  'ตรวจเปิดสภาพตู้ดับเพลิง ต้องไม่ชำรุด บุบ หรือแตก และเปิด-ปิดได้ง่าย',
  'ตรวจเปิดพื้นที่โดยรอบด้านหน้าของถังดับเพลิงต้องไม่มีสิ่งกีดขวาง',
];

const main = document.getElementById('main');
const answers = {}; // { 1: 'ปกติ' | 'ไม่ปกติ', ... }
let currentPoint = null;

function getPointIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function init() {
  const pointId = getPointIdFromUrl();
  if (!pointId) {
    renderError('ไม่พบรหัสจุดตรวจสอบ (Point ID) ในลิงก์ กรุณาสแกน QR code ใหม่อีกครั้ง');
    return;
  }

  try {
    const res = await fetch(`/api/points/${encodeURIComponent(pointId)}`);
    if (!res.ok) {
      renderError(`ไม่พบจุดตรวจสอบรหัส "${pointId}" กรุณาตรวจสอบ QR code`);
      return;
    }
    currentPoint = await res.json();
    renderForm();
  } catch (err) {
    renderError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่');
  }
}

function renderError(message) {
  main.innerHTML = `
    <div class="state-box error">
      <div style="font-size:32px;">⚠️</div>
      <p>${message}</p>
    </div>
  `;
}

function renderForm() {
  const isExt = currentPoint.type === 'extinguisher';
  const criteria = isExt ? EXT_CRITERIA : CAB_CRITERIA;
  const typeLabel = isExt ? 'ถังดับเพลิง · Fire Extinguisher' : 'ตู้ดับเพลิง · Fire Cabinet';

  main.innerHTML = `
    <div class="point-card">
      <span class="point-type">${typeLabel}</span>
      <div class="point-id">${currentPoint.point_id}</div>
      <div class="point-location">${currentPoint.location_th}</div>
      <div class="point-floor">ชั้น / Floor: ${currentPoint.floor}</div>
    </div>

    <div class="hint-banner">แตะ "ปกติ" หรือ "ไม่ปกติ" ให้ครบทั้ง 6 ข้อ ก่อนกดส่ง</div>

    <div class="section-label">ผลการตรวจสอบ</div>
    <div class="checklist" id="checklist"></div>

    <div class="field-group">
      <label class="field-label">หมายเหตุ (ถ้ามี)</label>
      <textarea id="remarks" rows="3" placeholder="ระบุรายละเอียดหากพบ ไม่ปกติ"></textarea>
    </div>

    <div class="submit-bar">
      <div class="submit-bar-inner">
        <button class="btn-submit" id="submitBtn" disabled>กรอกให้ครบก่อนส่ง (0/6)</button>
      </div>
    </div>
  `;

  const checklistEl = document.getElementById('checklist');
  criteria.forEach((text, idx) => {
    const num = idx + 1;
    const row = document.createElement('div');
    row.className = 'check-row';
    row.id = `row-${num}`;
    row.innerHTML = `
      <div class="check-num">${num}</div>
      <div class="check-text">${text}</div>
      <div class="check-toggle">
        <button class="toggle-btn ok" data-num="${num}" data-val="ปกติ">ปกติ</button>
        <button class="toggle-btn bad" data-num="${num}" data-val="ไม่ปกติ">ไม่ปกติ</button>
      </div>
    `;
    checklistEl.appendChild(row);
  });

  checklistEl.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const num = btn.dataset.num;
      const val = btn.dataset.val;
      answers[num] = val;

      const row = document.getElementById(`row-${num}`);
      row.classList.remove('answered-ok', 'answered-bad');
      row.classList.add(val === 'ปกติ' ? 'answered-ok' : 'answered-bad');

      row.querySelectorAll('.toggle-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');

      updateSubmitState();
    });
  });

  document.getElementById('submitBtn').addEventListener('click', submitChecklist);
}

function updateSubmitState() {
  const answeredCount = Object.keys(answers).length;
  const btn = document.getElementById('submitBtn');
  btn.textContent = answeredCount === 6 ? 'ส่งผลการตรวจสอบ' : `กรอกให้ครบก่อนส่ง (${answeredCount}/6)`;
  btn.disabled = answeredCount < 6;
}

async function submitChecklist() {
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'กำลังส่งข้อมูล...';

  const payload = {
    pointId: currentPoint.point_id,
    criteria1: answers[1],
    criteria2: answers[2],
    criteria3: answers[3],
    criteria4: answers[4],
    criteria5: answers[5],
    criteria6: answers[6],
    remarks: document.getElementById('remarks').value.trim(),
  };

  try {
    const res = await fetch('/api/checklist/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Submission failed');
    }
    renderSuccess();
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'ส่งผลการตรวจสอบ';
    alert(`เกิดข้อผิดพลาด: ${err.message}\nกรุณาลองใหม่อีกครั้ง`);
  }
}

function renderSuccess() {
  main.innerHTML = `
    <div class="success-box">
      <div class="success-icon">✓</div>
      <div class="success-title">บันทึกผลการตรวจสอบแล้ว</div>
      <div class="success-sub">จุดตรวจสอบ: ${currentPoint.point_id}</div>
      <div class="success-sub">${currentPoint.location_th}</div>
    </div>
  `;
}

init();
