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

    this.socket.on("disconnect", () => {
      console.log("Disconnected from real-time sync server");
    });
  }

  emitUpdate(type: string, payload: any) {
    if (!this.socket) return;
    this.socket.emit("sync-data", { type, payload });
  }

  onUpdate(callback: (data: { type: string; payload: any }) => void) {
    if (!this.socket) return;
    this.socket.on("data-updated", callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
