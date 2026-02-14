@echo off
echo Starting Vistaran Help Desk Server in 24/7 mode...
echo ================================================
echo Server will run continuously on port 3000
echo Access the application at: http://localhost:3000
echo ================================================

:START
echo Server starting...
npm start
echo Server stopped unexpectedly, restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto START