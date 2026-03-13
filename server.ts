import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 50e6 // 50MB limit
  });

  const PORT = 3000;

  // Store for real-time data synchronization
  const dataStores = new Map();

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Send initial data to the newly connected client
    socket.emit("data_update", {
      type: "INITIAL_SYNC",
      data: Object.fromEntries(dataStores)
    });

    socket.on("sync_data", (data: any) => {
      const { collection, data: items } = data;
      if (collection && items !== undefined) {
        dataStores.set(collection, items);
        // Broadcast the update to all other connected clients
        socket.broadcast.emit("data_update", {
          type: "DATA_UPDATE",
          collection,
          data: items,
          timestamp: Date.now()
        });
      }
    });

    socket.on("heartbeat", () => {
      socket.emit("heartbeat_response", { timestamp: Date.now() });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
