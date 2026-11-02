@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js 22 or higher first.
  pause
  exit /b 1
)
if not exist node_modules\mongodb (
  call npm install
  if errorlevel 1 exit /b 1
)
echo MongoDB must be running. Configure MONGODB_URI in .env if needed.
echo Opening Classyar at http://127.0.0.1:4173 or the PORT configured in .env
start "" http://127.0.0.1:4173
node server.mjs
pause
