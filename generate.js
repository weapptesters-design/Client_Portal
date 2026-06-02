const fs = require('fs');

const csv = fs.readFileSync('orders.csv', 'utf8');

// clean lines
const rows = csv
  .replace(/\r/g, '')
  .split('\n')
  .filter(r => r.trim() !== '');

// header row lo
const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

// helper function → column index find karega
function get(row, name) {
  const index = headers.indexOf(name);
  return index !== -1 ? (row[index] || '').trim() : '';
}

let output = 'window.ORDERS = {\n';

for (let i = 1; i < rows.length; i++) {
  const row = rows[i].split(',');

  const prefix = get(row, 'prefix');
  const code = get(row, 'app code');
  const suffix = get(row, 'suffix');
  const app = get(row, 'app name');

  const year = get(row, 'year');
  const month = get(row, 'month').padStart(2, '0');
  const day = get(row, 'start date').padStart(2, '0');

  const total = get(row, 'total days') || '14';
  const status = get(row, 'status') || 'active';

  // skip only if critical missing
  if (!prefix || !code || !suffix) {
    console.log(`⚠ Skipping row ${i + 1} (missing ID parts)`);
    continue;
  }

  const id = `${prefix}-${code}-${suffix}`;

  const startDate =
    (year && month && day)
      ? `${year}-${month}-${day}`
      : 'INVALID_DATE';

  output += `
'${id}': {
  appName: '${app}',
  startDate: '${startDate}',
  totalDays: ${parseInt(total) || 14},
  status: '${status}'
},
`;
}

output += '\n};';

fs.writeFileSync('orders.js', output);

console.log('✅ orders.js generated safely');
