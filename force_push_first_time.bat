@echo off
chcp 65001 >nul
title First-Time Force Push (overwrite remote with local)
cd /d "%~dp0"

echo ============================================================
echo  FIRST-TIME FORCE PUSH
echo  Overwrite remote 'main' with your local files (v1.07)
echo ============================================================
echo.
echo This is a ONE-TIME operation to align remote with local.
echo After this, use manual_push.bat for normal pushes.
echo.
echo WARNING: All previous remote commits on 'main' will be replaced.
echo.
pause

echo.
echo Running: git push -u origin main --force
echo.
git push -u origin main --force

echo.
echo ============================================================
echo Done. Check above for any errors.
echo If "everything up-to-date" or success message - all good!
echo Now you can delete this .bat (no longer needed) and use:
echo   - manual_push.bat (for daily pushes)
echo ============================================================
echo.
pause
