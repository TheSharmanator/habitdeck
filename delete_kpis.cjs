const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'server', 'data', 'u1_data.json');
const d = JSON.parse(fs.readFileSync(p, 'utf8'));

if (d.kpiLogs) {
  delete d.kpiLogs['2026-05-08'];
  delete d.kpiLogs['2026-05-07'];
}

if (d.habitLogs) {
  // Let's also delete habit logs for consistency, if they want to test both. But user specifically said "for KPI's". So I will only touch KPIs as requested.
}

fs.writeFileSync(p, JSON.stringify(d, null, 2));
console.log('Deleted last 2 days of KPIs successfully.');
