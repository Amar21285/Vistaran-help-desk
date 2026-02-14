@echo off
echo Vistaran Help Desk Server Management
echo =====================================
echo.
echo 1. Start Server (24/7 mode)
echo 2. Stop Server
echo 3. Restart Server
echo 4. View Server Status
echo 5. View Server Logs
echo 6. Exit
echo.
choice /C 123456 /M "Enter your choice"

if errorlevel 6 goto exit
if errorlevel 5 goto view_logs
if errorlevel 4 goto view_status
if errorlevel 3 goto restart_server
if errorlevel 2 goto stop_server
if errorlevel 1 goto start_server

:start_server
echo Starting Vistaran Help Desk Server...
npx pm2 start ecosystem.config.cjs
echo Server started successfully!
echo Access the application at: http://localhost:3000
goto pause_and_exit

:stop_server
echo Stopping Vistaran Help Desk Server...
npx pm2 stop vistaran-help-desk
echo Server stopped.
goto pause_and_exit

:restart_server
echo Restarting Vistaran Help Desk Server...
npx pm2 restart vistaran-help-desk
echo Server restarted.
goto pause_and_exit

:view_status
echo Current Server Status:
npx pm2 status
goto pause_and_exit

:view_logs
echo Viewing Server Logs (Press Ctrl+C to exit):
npx pm2 logs vistaran-help-desk
goto pause_and_exit

:pause_and_exit
echo.
pause