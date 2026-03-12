import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return;
    
    // In development, the socket server is on the same host/port
    this.socket = io();

    this.socket.on("connect", () => {
      console.log("Connected to real-time sync server");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      console.log("Ensure the server is running and accessible from this network.");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from real-time sync server:", reason);
    });

    // Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("heartbeat", { timestamp: Date.now() });
      }
    }, 30000);

    this.socket.on("heartbeat_response", () => {
      // Server is alive
    });
  }

  emitUpdate(collection: string, payload: any) {
    if (!this.socket) return;
    this.socket.emit("sync_data", { collection, data: payload });
  }

  onUpdate(callback: (data: { type: string; collection: string; data: any }) => void) {
    if (!this.socket) return;
    this.socket.on("data_update", callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
