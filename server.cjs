const express = require('express');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const { reportService } = require('./services/reportService.cjs');

const app = express();
const server = createServer(app);

// Use JSON body parser for POST requests with increased limit for backups
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Trust proxy for production environments (Railway/Heroku/etc)
app.set('trust proxy', 1);

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

// Set data directory to root 'data' folder - where imported records are stored
const dataDir = path.join(__dirname, 'data');

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

app.post('/api/login', (req, res) => {
  const { identity, password } = req.body;
  const users = dataStores.get('users') || [];

  if (!identity) {
    return res.status(400).json({ error: 'Identity (name or email) is required' });
  }

  const foundUser = users.find(u =>
    (u.email?.toLowerCase() === identity.toLowerCase() || u.name?.toLowerCase() === identity.toLowerCase()) &&
    String(u.password) === String(password)
  );

  if (!foundUser) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (foundUser.status?.toLowerCase() !== 'active') {
    return res.status(403).json({ error: 'User account is inactive' });
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = foundUser;
  res.json(userWithoutPassword);
});

// Restoration API endpoints
app.post('/api/admin/restore-from-master', (req, res) => {
  console.log('POST /api/admin/restore-from-master received');
  const result = restoreFromMasterBackup();
  console.log('Restoration result:', result.success ? 'Success' : 'Failed');
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// Daily Report Automation Endpoints

app.get('/api/admin/report-settings', (req, res) => {
  const settings = reportService.getSettings();
  res.json(settings);
});

app.post('/api/admin/report-settings', (req, res) => {
  const result = reportService.updateSettings(req.body);
  if (result.success) {
      res.json(result);
  } else {
      res.status(500).json(result);
  }
});

app.get('/api/admin/sync-info', (req, res) => {
  try {
      const stats = {};
      for (const [collection, file] of Object.entries(dataFiles)) {
          if (fs.existsSync(file)) {
              const content = fs.readFileSync(file, 'utf8');
              const data = JSON.parse(content);
              stats[collection] = Array.isArray(data) ? data.length : 1;
          } else {
              stats[collection] = 0;
          }
      }
      res.json({ success: true, stats, timestamp: new Date().toISOString() });
  } catch (e) {
      res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/dsr-logs', (req, res) => {
  const auditPath = path.join(dataDir, 'audit-logs.json');
  try {
      if (fs.existsSync(auditPath)) {
          const logs = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
          const dsrLogs = logs.filter(l => l.userName === "DSR Automation" || l.action.includes("DSR"));
          res.json(dsrLogs.slice(0, 50));
      } else {
          res.json([]);
      }
  } catch (e) {
      res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/trigger-report', async (req, res) => {
  const { recipients, startDate, endDate } = req.body;
  const range = (startDate && endDate) ? { start: startDate, end: endDate } : null;
  const result = await reportService.generateAndSendReport(recipients, range);
  if (result.success) {
      res.json(result);
  } else {
      res.status(500).json(result);
  }
});

app.post('/api/admin/restore-from-upload', (req, res) => {
  console.log('POST /api/admin/restore-from-upload received');
  const masterData = req.body;
  if (!masterData || typeof masterData !== 'object') {
    console.warn('Invalid master data received in upload');
    return res.status(400).json({ success: false, error: 'Invalid data format' });
  }
  
  const result = performSystemRestoration(masterData, 'User Upload');
  console.log('Upload restoration result:', result.success ? 'Success' : 'Failed');
  res.json(result);
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Set up Socket.IO for real-time synchronization
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your specific domain
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 50e6 // 50MB limit for attendance photos and backups
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

// Load existing data from files with master backup fallback
function performSystemRestoration(masterData, sourceName) {
  const storageKeyMap = {
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
    'auditlog': 'vistaran-helpdesk-auditlog',
    'notifications': 'vistaran-helpdesk-notifications',
    'notification-settings': 'vistaran-helpdesk-notification-settings',
    'notificationSettings': 'vistaran-helpdesk-notificationSettings',
    'theme': 'vistaran-helpdesk-theme',
    'invoices': 'vistaran-helpdesk-invoices',
    'branches': 'vistaran-helpdesk-branches'
  };

  const results = {};
  for (const [collection, filePath] of Object.entries(dataFiles)) {
    const masterKey = storageKeyMap[collection] || `vistaran-helpdesk-${collection}`;
    if (masterData[masterKey]) {
      let data = masterData[masterKey];

      // Special handling for notification settings to preserve DSR config
      if (collection === 'notification-settings') {
        try {
          if (fs.existsSync(filePath)) {
            const currentSettings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (currentSettings.dailyReport) {
              data = { ...data, dailyReport: currentSettings.dailyReport };
              console.log('[Restore] Preserved existing DSR settings during restoration');
            }
          }
        } catch (e) {
          console.error('[Restore] Error merging notification settings:', e);
        }
      }

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      dataStores.set(collection, data);
      results[collection] = Array.isArray(data) ? data.length : 'Object';
    }
  }

  // Broadcast to all clients
  io.emit('initial_sync', Object.fromEntries(dataStores));

  return { success: true, source: sourceName, results };
}

function restoreFromMasterBackup() {
  const masterPaths = [
    path.join(__dirname, 'Vistaran_Master_Sync_Update.json'),
    path.join(__dirname, 'Vistaran_Master_Sync-1.json'),
    path.join(__dirname, 'Vistaran_Master_Sync.json')
  ];
  
  let masterData = null;
  let usedPath = '';
  for (const p of masterPaths) {
    if (fs.existsSync(p)) {
      try {
        masterData = JSON.parse(fs.readFileSync(p, 'utf8'));
        usedPath = p;
        break;
      } catch (e) {}
    }
  }

  if (!masterData) return { success: false, error: 'No master backup found' };

  return performSystemRestoration(masterData, path.basename(usedPath));
}

// REST API for restoration
// (Moved to top)

function loadDataFromFile() {
  const masterPaths = [
    path.join(__dirname, 'Vistaran_Master_Sync_Update.json'),
    path.join(__dirname, 'Vistaran_Master_Sync-1.json'),
    path.join(__dirname, 'Vistaran_Master_Sync.json')
  ];
  
  let masterData = null;
  for (const p of masterPaths) {
    if (fs.existsSync(p)) {
      try {
        masterData = JSON.parse(fs.readFileSync(p, 'utf8'));
        console.log(`Initial Load: Master backup found at: ${path.basename(p)}`);
        break;
      } catch (e) {
        console.error(`Failed to parse master backup at ${p}:`, e.message);
      }
    }
  }

  const storageKeyMap = {
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

  for (const [collection, filePath] of Object.entries(dataFiles)) {
    try {
      let data = [];
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(rawData);
      }

      // Fallback to master data if individual file is empty or missing
      if ((!data || (Array.isArray(data) && data.length === 0)) && masterData) {
        const masterKey = storageKeyMap[collection] || `vistaran-helpdesk-${collection}`;
        if (masterData[masterKey]) {
          data = masterData[masterKey];
          console.log(`Fallback: Loaded ${collection} from master backup (${Array.isArray(data) ? data.length : 'Object'} records)`);
          // Save back to individual file
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
      }

      dataStores.set(collection, data || []);
      console.log(`Loaded ${collection}: ${Array.isArray(data) ? data.length : 'Object'} records`);
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
    console.log(`[Sync] Updated ${collection} on disk: ${data.length} records`);

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
      console.log(`[Sync] Received ${collection} update from user ${userId || socket.id} (${Array.isArray(items) ? items.length : 'object'} records)`);
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
      console.log(`[Sync] Broadcasted ${collection} to all other clients`);
    } else {
      console.warn(`[Sync] Received invalid sync_data for: ${collection}`);
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
app.get('*', (req, res) => {
  // If it's an API request that wasn't handled, return 404 JSON, not HTML
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend build (dist) not found. Please run npm run build.');
  }
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