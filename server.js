// server.js
const express = require('express');
const path    = require('path');
const xlsx    = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// ← Sửa EXCEL_PATH thành đường dẫn có dấu / hoặc escape \\
// Ví dụ dùng / (Node hỗ trợ trên Windows):
const EXCEL_PATH = 'C:/Users/truong.nx1/Ortholite Vietnam/OVN Production - Documents/PRODUCTION/Hiền/Production Schedule Control/Powerapp.xlsx';

let cachedData = [];

// Load file Excel local
function loadExcel() {
  try {
    const wb = xlsx.readFile(EXCEL_PATH);
    const sheet = wb.Sheets['Data Power app'];
    if (!sheet) throw new Error('Không tìm thấy sheet "Data Power app"');
    cachedData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`✅ Loaded ${cachedData.length} rows from local Excel`);
  } catch (err) {
    console.error('❌ Lỗi đọc Excel:', err.message);
    cachedData = [];
  }
}

// Load lần đầu và reload mỗi 5 phút
loadExcel();
setInterval(loadExcel, 5 * 60 * 1000);

// API raw
app.get('/api/data', (req, res) => res.json(cachedData));

// API summary
app.get('/api/summary', (req, res) => {
  if (cachedData.length <= 1) return res.json([]);
  const HEADER = 1, MIDX = 57, QIDX = 6;
  const map = {};
  for (let i = HEADER; i < cachedData.length; i++) {
    const row = cachedData[i];
    const m   = String(row[MIDX] || '').trim();
    const q   = parseFloat(row[QIDX]) || 0;
    map[m] = (map[m] || 0) + q;
  }
  res.json(Object.entries(map).map(([machine, total]) => ({ machine, total })));
});

// API details
app.get('/api/details', (req, res) => {
  const machine = req.query.machine;
  if (!machine) return res.status(400).json({ error: 'Thiếu máy' });

  const HEADER = 1, MIDX = 57, OIDX = 2, BIDX = 3, TIDX = 5, QIDX = 6;
  const details = [];
  for (let i = HEADER; i < cachedData.length; i++) {
    const row = cachedData[i];
    if (String(row[MIDX] || '').trim() === machine) {
      details.push({
        order      : row[OIDX]   || '',
        brandCode  : row[BIDX]   || '',
        productType: row[TIDX]   || '',
        quantity   : parseFloat(row[QIDX]) || 0
      });
    }
  }
  res.json(details);
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
});
