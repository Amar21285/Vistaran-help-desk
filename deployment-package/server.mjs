import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Set up Socket.IO for real-time synchronization
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your specific domain
    methods: ["GET", "POST"]
  }
});

// Store for real-time data synchronization
const dataStores = new Map();
const dataFiles = {
  'users': path.join(dataDir, 'users.json'),
  'tickets': path.join(dataDir, 'tickets.json'),
  'technicians': path.join(dataDir, 'technicians.json'),
  'files': path.join(dataDir, 'files.json'),
  'symptoms': path.join(dataDir, 'symptoms.json'),
  'templates': path.join(dataDir, 'templates.json'),
  'departments': path.join(dataDir, 'departments.json'),
  'inventory': path.join(dataDir, 'inventory.json'),
  'vendors': path.join(dataDir, 'vendors.json'),
  'challans': path.join(dataDir, 'challans.json'),
  'outward-invoices': path.join(dataDir, 'outward-invoices.json'),
  'purchase-orders': path.join(dataDir, 'purchase-orders.json')
};

// Load existing data from files
function loadDataFromFile() {
  for (const [collection, filePath] of Object.entries(dataFiles)) {
    try {
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(rawData);
        dataStores.set(collection, data);
      } else {
        // Initialize with empty array if file doesn't exist
        dataStores.set(collection, []);
        saveDataToFile(collection, []);
      }
    } catch (err) {
      console.error(`Error loading ${collection} data:`, err);
      dataStores.set(collection, []);
    }
  }
}

// Save data to file
function saveDataToFile(collection, data) {
  try {
    const filePath = dataFiles[collection];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error saving ${collection} data:`, err);
  }
}

// Load data when server starts
loadDataFromFile();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send initial data to the newly connected client
  socket.emit('initial_data', Object.fromEntries(dataStores));

  // Listen for data updates from clients
  socket.on('sync_data', (data) => {
    const { collection, items } = data;
    if (collection && items) {
      dataStores.set(collection, items);
      
      // Save to file
      saveDataToFile(collection, items);
      
      // Broadcast the update to all other connected clients
      socket.broadcast.emit('data_updated', {
        collection,
        items,
        timestamp: Date.now()
      });
    }
  });

  // Handle real-time updates for tickets, users, etc.
  socket.on('ticket_update', (ticketData) => {
    socket.broadcast.emit('ticket_updated', ticketData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve the index.html file for all routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Use the port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Vistaran Help Desk Server running on port ${PORT}`);
  console.log(`Access the application at: http://localhost:${PORT}`);
  console.log(`Server is running in 24/7 mode...`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});