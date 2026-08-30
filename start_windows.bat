@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18 ou plus recent est requis pour le serveur local.
  echo Vous pouvez aussi ouvrir index.html directement dans Chrome ou Edge.
  pause
  exit /b 1
)
start "" http://localhost:4173
node scripts\server.mjs
