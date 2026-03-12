@echo off
title Vistaran Help Desk - Manual Data Recovery
echo ====================================================
echo Vistaran Help Desk - Manual Data Recovery Tool
echo ====================================================
echo.
echo This tool will restore all your data (Assets, Tickets, Users, etc.)
echo from your Master Backup file.
echo.
echo WARNING: This will overwrite your current data with the backup!
echo.
pause

echo.
echo Running recovery script...
node manual-recovery.cjs

if errorlevel 1 (
    echo.
    echo ❌ Recovery failed! Please check if Node.js is installed.
) else (
    echo.
    echo ✅ Recovery completed successfully!
    echo.
    echo You may need to restart your server if it's currently running.
)

echo.
pause
