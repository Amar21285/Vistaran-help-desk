# Vistaran Help Desk - 24/7 Server Operation Guide

## Current Status
✅ Server is currently running on port 3000 (PID 16344)
✅ All updates and features are active
✅ Data integrity maintained

## Options for 24/7 Operation

### Option 1: Using the Batch File (Recommended for Windows)
Run: `start-server-24x7.bat`
- Automatically rebuilds if needed
- Restarts server if it crashes
- Continuous operation

### Option 2: Using PM2 (If installed)
```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 startup
pm2 save
```

### Option 3: Manual restart
The server is already running on port 3000 via PID 16344. To ensure continuity:

1. **Check server status:**
   ```cmd
   netstat -ano | findstr :3000
   ```

2. **If server stops, restart manually:**
   ```cmd
   cd "c:\Users\vista\Desktop\vistaran-help-desk (1)"
   node server.mjs
   ```

## Automatic Restart Script
The `start-server-24x7.bat` file contains:
- Automatic build before starting
- Continuous operation with restart on failure
- Error handling and retry mechanism

## Server Configuration
- Port: 3000 (hardcoded in server.mjs)
- Host: 0.0.0.0 (accessible from network)
- 24/7 mode enabled
- Graceful shutdown handling

## Access
- URL: http://localhost:3000
- Network access: http://[YOUR_IP]:3000

The server will continue running on port 3000 with all your data and updates preserved.