import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  // Use JSON body parser for POST requests
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 50e6 // 50MB limit
  });

  const PORT = process.env.PORT || 3000;
  const dataDir = path.join(process.cwd(), 'data');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Store for real-time data synchronization
  const dataStores = new Map();
  const dataFiles: Record<string, string> = {
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

  // Helper functions for data management
  function performSystemRestoration(masterData: any, sourceName: string) {
    const storageKeyMap: Record<string, string> = {
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
      'invoices': 'vistaran-helpdesk-invoices',
      'branches': 'vistaran-helpdesk-branches'
    };

    const results: Record<string, any> = {};
    for (const [collection, filePath] of Object.entries(dataFiles)) {
      const masterKey = storageKeyMap[collection] || `vistaran-helpdesk-${collection}`;
      if (masterData[masterKey]) {
        const data = masterData[masterKey];
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        dataStores.set(collection, data);
        results[collection] = Array.isArray(data) ? data.length : 'Object';
      }
    }

    io.emit('initial_sync', Object.fromEntries(dataStores));
    return { success: true, source: sourceName, results };
  }

  // Routes for master sync files
  app.get("/Vistaran_Master_Sync.json", (req, res) => {
    const p = path.join(process.cwd(), 'Vistaran_Master_Sync.json');
    if (fs.existsSync(p)) {
      res.sendFile(p);
    } else {
      res.status(404).json({ error: 'Master sync file not found' });
    }
  });

  function restoreFromMasterBackup() {
    const masterPaths = [
      path.join(process.cwd(), 'Vistaran_Master_Sync_Update.json'),
      path.join(process.cwd(), 'Vistaran_Master_Sync-1.json'),
      path.join(process.cwd(), 'Vistaran_Master_Sync.json')
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

  // Initial data load
  for (const [collection, filePath] of Object.entries(dataFiles)) {
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        dataStores.set(collection, data);
      } catch (e) {
        console.error(`Failed to load ${collection}:`, e);
      }
    }
  }

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.emit("data_update", {
      type: "INITIAL_SYNC",
      data: Object.fromEntries(dataStores)
    });

    socket.on("sync_data", (data: any) => {
      const { collection, data: items } = data;
      if (collection && items !== undefined) {
        dataStores.set(collection, items);
        if (dataFiles[collection]) {
            fs.writeFileSync(dataFiles[collection], JSON.stringify(items, null, 2));
        }
        socket.broadcast.emit("data_update", {
          type: "DATA_UPDATE",
          collection,
          data: items,
          timestamp: Date.now()
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/:collection", (req, res) => {
    const { collection } = req.params;
    if (dataStores.has(collection)) {
      res.json(dataStores.get(collection));
    } else {
      res.status(404).json({ error: 'Collection not found' });
    }
  });

  app.post("/api/admin/restore-from-master", (req, res) => {
    console.log('POST /api/admin/restore-from-master received');
    const result = restoreFromMasterBackup();
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Final catch-all for API 404s
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
