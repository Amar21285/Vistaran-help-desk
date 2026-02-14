// Mock WebSocket Server Implementation for Real-time Synchronization
// This simulates server-side functionality for demonstration purposes

interface ClientConnection {
  id: string;
  role: string; // 'admin' or 'client'
  send: (data: any) => void;
}

interface SyncMessage {
  type: string;
  collection: string;
  data: any;
  userId?: string;
  timestamp: number;
}

class MockWebSocketServer {
  private clients: Map<string, ClientConnection> = new Map();
  private dataStores: Map<string, any[]> = new Map();

  constructor() {
    // Initialize data stores with existing localStorage data
    this.initializeDataStores();
  }

  private initializeDataStores() {
    // Initialize with the existing data structure from the application
    const storeKeys = [
      'vistaran-helpdesk-users',
      'vistaran-helpdesk-tickets', 
      'vistaran-helpdesk-technicians',
      'vistaran-helpdesk-files',
      'vistaran-helpdesk-symptoms',
      'vistaran-helpdesk-templates',
      'vistaran-helpdesk-departments',
      'vistaran-helpdesk-inventory',
      'vistaran-helpdesk-vendors',
      'vistaran-helpdesk-challans',
      'vistaran-helpdesk-outward-invoices',
      'vistaran-helpdesk-purchase-orders'
    ];

    storeKeys.forEach(key => {
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          this.dataStores.set(key, JSON.parse(storedData));
        } else {
          this.dataStores.set(key, []);
        }
      } catch (e) {
        console.error(`Error initializing store for ${key}:`, e);
        this.dataStores.set(key, []);
      }
    });
  }

  // Simulate connecting a client
  connectClient(clientId: string, role: string, sendCallback: (data: any) => void): void {
    const client: ClientConnection = {
      id: clientId,
      role,
      send: sendCallback
    };
    
    this.clients.set(clientId, client);
    console.log(`Client ${clientId} (${role}) connected`);

    // Send initial sync data
    this.sendInitialSyncData(clientId);
  }

  // Simulate disconnecting a client
  disconnectClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  }

  // Handle incoming messages from clients
  handleMessage(clientId: string, message: SyncMessage): void {
    console.log(`Received message from ${clientId}:`, message);

    switch (message.type) {
      case 'SYNC_DATA':
        this.handleSyncData(message);
        break;
      case 'REQUEST_FULL_SYNC':
        this.sendFullSyncData(clientId);
        break;
      case 'HEARTBEAT':
        // Respond to heartbeat
        this.sendMessageToClient(clientId, {
          type: 'HEARTBEAT_RESPONSE',
          timestamp: Date.now()
        });
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private handleSyncData(message: SyncMessage): void {
    // Update the local data store
    const storeKey = `vistaran-helpdesk-${message.collection}`;
    this.dataStores.set(storeKey, message.data);

    // Persist to localStorage
    try {
      localStorage.setItem(storeKey, JSON.stringify(message.data));
    } catch (e) {
      console.error(`Error persisting ${storeKey} to localStorage:`, e);
    }

    // Broadcast to all other connected clients
    this.broadcastToOtherClients(message, message.userId || '');
  }

  private sendInitialSyncData(clientId: string): void {
    // Send initial data to the newly connected client
    const storeKeys = Array.from(this.dataStores.keys());
    const initialData: { [key: string]: any } = {};

    storeKeys.forEach(key => {
      const cleanKey = key.replace('vistaran-helpdesk-', '');
      initialData[cleanKey] = this.dataStores.get(key) || [];
    });

    this.sendMessageToClient(clientId, {
      type: 'INITIAL_SYNC',
      data: initialData,
      timestamp: Date.now()
    });
  }

  private sendFullSyncData(clientId: string): void {
    const storeKeys = Array.from(this.dataStores.keys());
    const fullData: { [key: string]: any } = {};

    storeKeys.forEach(key => {
      const cleanKey = key.replace('vistaran-helpdesk-', '');
      fullData[cleanKey] = this.dataStores.get(key) || [];
    });

    this.sendMessageToClient(clientId, {
      type: 'FULL_SYNC',
      data: fullData,
      timestamp: Date.now()
    });
  }

  private broadcastToOtherClients(message: SyncMessage, senderId: string): void {
    this.clients.forEach((client, clientId) => {
      if (clientId !== senderId) {
        // Add a delay to simulate network latency
        setTimeout(() => {
          this.sendMessageToClient(clientId, {
            ...message,
            type: 'DATA_UPDATE',
            from: senderId
          });
        }, Math.random() * 100); // Random delay up to 100ms
      }
    });
  }

  private sendMessageToClient(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.send(message);
      } catch (e) {
        console.error(`Error sending message to client ${clientId}:`, e);
        this.disconnectClient(clientId);
      }
    }
  }

  // Public method to manually trigger a sync from external sources
  triggerSync(collection: string, data: any[], userId?: string): void {
    const message: SyncMessage = {
      type: 'SYNC_DATA',
      collection,
      data,
      userId,
      timestamp: Date.now()
    };

    this.handleSyncData(message);
  }

  // Get current server stats
  getStats(): { clientCount: number; collections: string[] } {
    return {
      clientCount: this.clients.size,
      collections: Array.from(this.dataStores.keys()).map(key => 
        key.replace('vistaran-helpdesk-', '')
      )
    };
  }
}

// Global instance to simulate a server
let mockServerInstance: MockWebSocketServer | null = null;

export const getMockWebSocketServer = (): MockWebSocketServer => {
  if (!mockServerInstance) {
    mockServerInstance = new MockWebSocketServer();
  }
  
  // Make server instance available globally for debugging/stats
  if (typeof window !== 'undefined') {
    (window as any).mockWebSocketServer = mockServerInstance;
  }
  
  return mockServerInstance;
};

// Export a function to simulate WebSocket connection
export const createMockWebSocketConnection = (
  clientId: string, 
  role: string, 
  onMessage: (data: any) => void
): { 
  send: (data: any) => void; 
  close: () => void; 
  onMessage: (handler: (data: any) => void) => void 
} => {
  const server = getMockWebSocketServer();
  
  // Connect the client
  server.connectClient(clientId, role, onMessage);

  return {
    send: (data: any) => {
      server.handleMessage(clientId, data);
    },
    close: () => {
      server.disconnectClient(clientId);
    },
    onMessage: (handler: (data: any) => void) => {
      // This is handled by the connection callback
    }
  };
};