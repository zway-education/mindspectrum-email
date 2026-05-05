@echo off
chcp 65001 >nul
title Manual Push (visible)
cd /d "%~dp0"

if not exist "%~dp0auto_push.ps1" (
  echo [X] auto_push.ps1 not found.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0auto_push.ps1"

echo.
echo (Window stays open. Check push_log.txt for details)
pause
