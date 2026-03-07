const express = require('express');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = createServer(app);

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Force disable Supabase for now - use local file storage
const useSupabase = false;

console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'NOT SET');
console.log('Using local file storage');

let supabase;
if (useSupabase) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Using Supabase for data storage');
} else {
  console.log('Using local file storage');
}

// Check if running on Railway (production) or locally
const isProduction = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production';
const dataDir = isProduction
  ? path.join(__dirname, 'dist', 'data')
  : path.join(__dirname, 'data');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// API endpoints for data access (Must be before static serving)
app.get('/api/:collection', (req, res) => {
  const { collection } = req.params;
  if (dataStores.has(collection)) {
    res.json(dataStores.get(collection));
  } else {
    res.status(404).json({ error: 'Collection not found' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

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
  'purchase-orders': path.join(dataDir, 'purchase-orders.json'),
  'attendance': path.join(dataDir, 'attendance.json'),
  'reimbursements': path.join(dataDir, 'reimbursements.json'),
  'audit-logs': path.join(dataDir, 'audit-logs.json'),
  'notifications': path.join(dataDir, 'notifications.json'),
  'notification-settings': path.join(dataDir, 'notification-settings.json'),
  'theme': path.join(dataDir, 'theme.json'),
  'invoices': path.join(dataDir, 'invoices.json')
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

    // Also update the master backup file in real-time
    consolidateToMaster();
  } catch (err) {
    console.error(`Error saving ${collection} data:`, err);
  }
}

// Consolidate all individual data files into a single master backup
function consolidateToMaster() {
  try {
    const masterData = {};
    const keyMap = {
      'users': 'vistaran-helpdesk-users',
      'tickets': 'vistaran-helpdesk-tickets',
      'technicians': 'vistaran-helpdesk-technicians',
      'files': 'vistaran-helpdesk-files',
      'symptoms': 'vistaran-helpdesk-symptoms',
      'templates': 'vistaran-helpdesk-templates',
      'departments': 'vistaran-helpdesk-departments',
      'inventory': 'vistaran-helpdesk-inventory',
      'vendors': 'vistaran-helpdesk-vendors',
      'challans': 'vistaran-helpdesk-challans',
      'outward-invoices': 'vistaran-helpdesk-outward-invoices',
      'purchase-orders': 'vistaran-helpdesk-purchase-orders',
      'attendance': 'vistaran-helpdesk-attendance',
      'reimbursements': 'vistaran-helpdesk-reimbursements',
      'audit-logs': 'vistaran-helpdesk-audit-logs',
      'notifications': 'vistaran-helpdesk-notifications',
      'notification-settings': 'vistaran-helpdesk-notification-settings',
      'theme': 'vistaran-helpdesk-theme',
      'invoices': 'vistaran-helpdesk-invoices'
    };

    for (const [collection, file] of Object.entries(dataFiles)) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        try {
          masterData[keyMap[collection] || `vistaran-helpdesk-${collection}`] = JSON.parse(content);
        } catch (e) {
          masterData[keyMap[collection] || `vistaran-helpdesk-${collection}`] = content;
        }
      }
    }

    const masterPath = path.join(__dirname, 'Vistaran_Master_Sync_Update.json');
    fs.writeFileSync(masterPath, JSON.stringify(masterData, null, 2));
  } catch (err) {
    console.error('Error consolidating to master:', err);
  }
}

// Load data from Supabase
async function loadDataFromSupabase() {
  const collections = ['users', 'tickets', 'technicians', 'files', 'symptoms', 'templates', 'departments', 'inventory', 'vendors', 'challans', 'outward-invoices', 'purchase-orders'];

  for (const collection of collections) {
    try {
      const { data, error } = await supabase
        .from(collection)
        .select('*');

      if (error) throw error;
      dataStores.set(collection, data || []);
      console.log(`Loaded ${collection} from Supabase: ${data?.length || 0} records`);
    } catch (err) {
      console.error(`Error loading ${collection} from Supabase:`, err.message);
      dataStores.set(collection, []);
    }
  }
}

// Save data to Supabase
async function saveDataToSupabase(collection, data) {
  try {
    // Transform data to match database columns
    let transformedData = data;

    // Map data to match app's expected format
    if (collection === 'users' && data && data.length > 0) {
      transformedData = data.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role || u.status,
        department: u.department,
        status: u.status || 'Active',
        photo: u.photo || '',
        joinedDate: u.createdAt || u.joinedDate || new Date().toISOString(),
        phone: u.phone || '',
        whatsapp: u.whatsapp || '',
        employeeId: u.employeeId || '',
        designation: u.designation || ''
      }));
    }

    if (collection === 'tickets' && data && data.length > 0) {
      transformedData = data.map(t => ({
        id: t.id,
        userId: t.reporter || t.userId || '',
        email: t.email || '',
        description: t.description || t.title || '',
        department: t.department || '',
        priority: t.priority || 'medium',
        status: t.status || 'Open',
        dateCreated: t.createdAt || t.dateCreated || new Date().toISOString(),
        dateResolved: t.dateResolved || null,
        assignedTechId: t.assignee || t.assignedTechId || null,
        symptomId: t.symptomId || '',
        notes: t.notes || '',
        cc: t.cc || ''
      }));
    }

    // First delete all existing records
    await supabase.from(collection).delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Then insert new data
    if (transformedData && transformedData.length > 0) {
      const { error } = await supabase.from(collection).insert(transformedData);
      if (error) throw error;
    }

    console.log(`Saved ${collection} to Supabase: ${transformedData?.length || 0} records`);
  } catch (err) {
    console.error(`Error saving ${collection} to Supabase:`, err.message);
  }
}

// Load data when server starts
if (useSupabase) {
  loadDataFromSupabase().then(() => {
    console.log('Initial data loaded from Supabase');
  });
} else {
  loadDataFromFile();
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send initial data to the newly connected client
  console.log(`Sending INITIAL_SYNC to ${socket.id} with:`, {
    users: dataStores.get('users')?.length || 0,
    inventory: dataStores.get('inventory')?.length || 0
  });
  socket.emit('data_update', {
    type: 'INITIAL_SYNC',
    data: Object.fromEntries(dataStores)
  });

  // Listen for data updates from clients
  socket.on('sync_data', (data) => {
    const { collection, data: items, type, userId, timestamp } = data;
    if (collection && items !== undefined) {
      dataStores.set(collection, items);

      // Save to file and/or Supabase
      if (!useSupabase) {
        saveDataToFile(collection, items);
      }
      if (useSupabase) {
        saveDataToSupabase(collection, items);
      }

      // Broadcast the update to all other connected clients
      socket.broadcast.emit('data_update', {
        type: type || 'DATA_UPDATE',
        collection,
        data: items,
        userId,
        timestamp: timestamp || Date.now()
      });
    }
  });

  // Handle real-time updates for tickets, users, etc.
  socket.on('ticket_update', (ticketData) => {
    socket.broadcast.emit('ticket_updated', ticketData);
  });

  // Handle heartbeat messages
  socket.on('heartbeat', (data) => {
    socket.emit('heartbeat_response', { type: 'HEARTBEAT_RESPONSE', timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
// API endpoints for data access
// (Removed from here, moved to top)

// Serve the index.html file for all routes (SPA support)
app.get('*', (req, res, next) => {
  // If it's an API request that wasn't handled, return 404 JSON, not HTML
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
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