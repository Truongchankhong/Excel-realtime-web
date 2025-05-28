const fs = require('fs');
const { execSync } = require('child_process');

const FILE = './data/Powerapp.xlsx';

console.log('📦 Copying new Excel & pushing to GitHub...');

try {
  if (!fs.existsSync(FILE)) throw new Error('File Powerapp.xlsx không tồn tại!');

  // Stage, commit & push
  execSync('git add data/Powerapp.xlsx');
  execSync(`git commit -m "🔄 Update Excel at ${new Date().toLocaleString()}"`);
  execSync('git push');

  console.log('✅ Đã cập nhật GitHub!');
} catch (err) {
  console.error('❌ Lỗi khi cập nhật GitHub:', err.message);
}
