const fs = require('fs');

const csv = fs.readFileSync('orders.csv', 'utf8')
  .replace(/\r/g, '')
  .replace(/\uFEFF/g, ''); // remove BOM

const rows = csv.split('\n').filter(r => r.trim());

const headers = rows[0]
  .split(',')
  .map(h => h.trim().toLowerCase().replace(/\s+/g, ''));

function get(row, name) {
  const index = headers.indexOf(name.toLowerCase().replace(/\s+/g, ''));
  return index !== -1 ? (row[index] || '').trim() : '';
}

// 📦 Load previous data
let previousData = {};
if (fs.existsSync('previous_orders.json')) {
  previousData = JSON.parse(fs.readFileSync('previous_orders.json', 'utf8'));
}

// 📦 Current data store
let currentData = {};
let newApps = [];
let changedApps = [];

for (let i = 1; i < rows.length; i++) {
  const row = rows[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  
  const prefix = get(row, 'prefix');
  const code = get(row, 'app code');
  const suffix = get(row, 'suffix');
  const app = get(row, 'app name');

  const year = get(row, 'year');
  const month = get(row, 'month').padStart(2, '0');
  const day = get(row, 'start date').padStart(2, '0');

  const total = get(row, 'total days') || '14';
  const status = get(row, 'status') || 'active';

  if (!prefix || !code || !suffix) continue;

  const id = `${prefix}-${code}-${suffix}`;

  const startDate =
    (year && month && day)
      ? `${year}-${month}-${day}`
      : 'INVALID_DATE';

  const newRecord = {
    app,
    startDate,
    totalDays: parseInt(total) || 14,
    status
  };

  currentData[id] = newRecord;

  const oldRecord = previousData[id];

  // 🆕 NEW APP
  if (!oldRecord) {
    newApps.push({ id, ...newRecord });
  }
  // ✏️ CHANGED APP
  else {
    if (
      oldRecord.startDate !== newRecord.startDate ||
      oldRecord.status !== newRecord.status ||
      oldRecord.totalDays !== newRecord.totalDays ||
      oldRecord.app !== newRecord.app
    ) {
      changedApps.push({ id, oldRecord, newRecord });
    }
  }
}

// 📦 Save JS file
let output = 'window.ORDERS = ' + JSON.stringify(currentData, null, 2);
fs.writeFileSync('orders.js', output);

// 📦 Save new state for next run
fs.writeFileSync('previous_orders.json', JSON.stringify(currentData, null, 2));

// 📦 Report file (for Telegram)
const report = {
  newCount: newApps.length,
  changedCount: changedApps.length,
  newApps,
  changedApps
};

fs.writeFileSync('report.json', JSON.stringify(report, null, 2));

console.log('✅ Smart tracking completed');
console.log(`🆕 New: ${newApps.length}`);
console.log(`✏️ Changed: ${changedApps.length}`);

console.log(headers);
console.log(rows[1]);
console.log(rows[1].split(','));
