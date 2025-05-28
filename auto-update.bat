@echo off
cd /d "C:\Users\truong.nx1\...\TURBO MAXIMUM SKILL"
copy /Y "C:\Users\truong.nx1\Ortholite Vietnam\OVN Production - Documents\PRODUCTION\Hiền\Production Schedule Control\Powerapp.xlsx" ".\data\Powerapp.xlsx"

git add .
git commit -m "♻️ Auto update Powerapp.xlsx at %date% %time%"
git push origin main
