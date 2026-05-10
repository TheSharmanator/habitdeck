const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'server', 'data', 'u1_data.json');
const d = JSON.parse(fs.readFileSync(p, 'utf8'));

d.habitLogs = d.habitLogs || {};
d.kpiLogs = d.kpiLogs || {};

const start = new Date('2026-01-01T00:00:00Z');
const end = new Date('2026-05-08T00:00:00Z');

const getScheduleIndex = (date) => {
  let day = date.getUTCDay();
  return day === 0 ? 6 : day - 1;
};

for (let curr = new Date(start); curr <= end; curr.setDate(curr.getDate() + 1)) {
  const dateStr = `${curr.getUTCFullYear()}-${String(curr.getUTCMonth() + 1).padStart(2, '0')}-${String(curr.getUTCDate()).padStart(2, '0')}`;
  
  const hData = {};
  for (const h of d.habits) {
    const sIdx = getScheduleIndex(curr);
    if (!h.schedule || h.schedule[sIdx]) {
      hData[h.id] = Math.random() > 0.2 ? 'happy' : 'sad';
    }
  }
  d.habitLogs[dateStr] = { locked: true, data: hData };
  
  const kData = {};
  for (const k of d.kpis) {
    if (k.id == 1) kData[k.id] = { value: String(Math.floor(Math.random() * 20000) + 4000) };
    else kData[k.id] = { value: String(Math.floor(Math.random() * 10) + 3) };
    
    const num = parseFloat(kData[k.id].value);
    kData[k.id].status = (num >= k.min && num <= k.max) ? 'success' : 'fail';
  }
  d.kpiLogs[dateStr] = { locked: true, data: kData };
}

fs.writeFileSync(p, JSON.stringify(d, null, 2));
console.log('Seeded successfully.');
