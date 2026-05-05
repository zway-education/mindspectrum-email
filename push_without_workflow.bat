@echo off
chcp 65001 >nul
title Push without workflow file (workaround for PAT scope issue)
cd /d "%~dp0"

if not exist "%~dp0push_without_workflow.ps1" (
  echo [X] push_without_workflow.ps1 not found.
  pause
  exit /b 1
)

echo ============================================================
echo  Workaround: Push without .github/workflows/deploy.yml
echo ============================================================
echo.
echo Your PAT doesn't have 'workflow' scope, so GitHub blocks
echo the workflow file. This script will:
echo.
echo   1. Untrack .github/workflows/deploy.yml from commit
echo   2. Amend the commit to exclude it
echo   3. Force push the rest
echo.
echo The workflow file STAYS on your computer (just not pushed).
echo You can add it later via GitHub web UI.
echo.
pause

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0push_without_workflow.ps1"

echo.
echo (Window stays open)
pause
