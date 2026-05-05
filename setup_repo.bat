@echo off
chcp 65001 >nul
title One-time Git Repo Setup
cd /d "%~dp0"

if not exist "%~dp0setup_repo.ps1" (
  echo [X] setup_repo.ps1 not found.
  pause
  exit /b 1
)

echo ============================================
echo  One-time setup: link this folder to GitHub
echo ============================================
echo.
echo This will:
echo   1. Initialize git in this folder
echo   2. Connect to https://github.com/zway-education/mindspectrum-email.git
echo   3. Pull existing files from GitHub
echo.
echo After this completes, use manual_push.bat for all future pushes.
echo.
pause

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_repo.ps1"

echo.
echo (Window stays open. Check setup_log.txt for details)
pause
