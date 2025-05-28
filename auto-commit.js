const { exec } = require('child_process');

exec(`
  git add data/Powerapp.xlsx &&
  git commit -m "Auto-update Powerapp.xlsx" &&
  git push
`, (err, stdout, stderr) => {
  if (err) return console.error('❌ GIT LỖI:', err.message);
  console.log('✅ Đã cập nhật lên GitHub');
});
