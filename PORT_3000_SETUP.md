# Vistaran Help Desk - Port 3000 Setup

## Overview
The application has been configured to run on port 3000 with real-time synchronization capabilities.

## Configuration Changes Made

1. **Vite Configuration** (`vite.config.ts`):
   - Set server port to 3000
   - Enabled external connections with `host: true`

2. **Real-time Synchronization** (`hooks/useRealtimeSync.tsx`):
   - Updated to use Socket.IO for real-time data sync
   - Connects to the server running on port 3000
   - Provides live synchronization between admin and client sides

3. **Production Server** (`server.cjs`):
   - Express.js server running on port 3000
   - Socket.IO integration for real-time sync
   - Static file serving from the build directory
   - Automatic build if dist folder doesn't exist

## How to Run 24/7 on Port 3000

### Option 1: Using npm command
```bash
npm run start
```

### Option 2: Using the batch file
Double-click on `start-server.bat` to run the server

### Option 3: Using the setup-prod command (builds first)
```bash
npm run setup-prod
```

## Access the Application
- Local access: http://localhost:3000
- Network access: http://[YOUR_IP_ADDRESS]:3000

## Real-time Synchronization Features
- Changes made by admins are instantly reflected for clients
- Bidirectional synchronization between all connected users
- Live status indicator in the top-right corner of the application
- Automatic connection when users log in
- Connection persistence across sessions

## Notes
- The server runs in production mode using the built files
- Real-time synchronization works across multiple browser tabs and different users
- The application will remain accessible 24/7 until the server is stopped
- To stop the server, press Ctrl+C in the terminal or close the command prompt

## Troubleshooting
- If the server fails to start, ensure port 3000 is not in use by another application
- If you encounter issues, try running `npm run build` first, then `npm run start`
- Check that all dependencies are installed with `npm install`