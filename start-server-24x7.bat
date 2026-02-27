@echo off
echo ========================================
echo Starting Vistaran Help Desk Server
echo ========================================
echo.

:START_SERVER
echo Building the application...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed. Retrying in 5 seconds...
    timeout /t 5
    goto START_SERVER
)

echo.
echo Starting server on port 3000...
node server.mjs

echo Server stopped unexpectedly. Restarting in 5 seconds...
timeout /t 5
goto START_SERVER