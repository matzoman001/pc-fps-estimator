@echo off
cd /d "%~dp0"
start "PC FPS Estimator Server" powershell -NoProfile -ExecutionPolicy Bypass -File "serve.ps1"
timeout /t 2 >nul
start "" http://localhost:5178/
