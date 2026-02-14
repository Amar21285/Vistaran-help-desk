/**
 * Test script to verify real-time synchronization functionality
 * This script demonstrates how the synchronization works
 */

console.log('=== Vistaran Help Desk - Real-time Sync Test ===\n');

// Test the mock WebSocket server functionality
import { getMockWebSocketServer, createMockWebSocketConnection } from './utils/mockWebSocketServer.js';

console.log('1. Initializing mock WebSocket server...');
const server = getMockWebSocketServer();
console.log('   Server initialized successfully');

console.log('\n2. Getting server statistics...');
const stats = server.getStats();
console.log(`   Connected clients: ${stats.clientCount}`);
console.log(`   Available collections: ${stats.collections.join(', ')}`);

console.log('\n3. Simulating client connections...');
let adminMessages = [];
let clientMessages = [];

// Create admin client connection
const adminConnection = createMockWebSocketConnection(
  'admin123', 
  'admin', 
  (message) => {
    console.log(`   Admin received: ${message.type}`);
    adminMessages.push(message);
  }
);

// Create client connection
const clientConnection = createMockWebSocketConnection(
  'client456', 
  'client', 
  (message) => {
    console.log(`   Client received: ${message.type}`);
    clientMessages.push(message);
  }
);

// Verify both clients are connected
const updatedStats = server.getStats();
console.log(`\n4. After connections - Connected clients: ${updatedStats.clientCount}`);

console.log('\n5. Testing data synchronization...');
// Simulate a data update from admin
const testData = {
  type: 'SYNC_DATA',
  collection: 'tickets',
  data: [{ id: 'TKT001', title: 'Test Ticket', status: 'OPEN' }],
  userId: 'admin123',
  timestamp: Date.now()
};

console.log('   Admin sending ticket update...');
adminConnection.send(testData);

// Wait a bit for the sync to propagate
setTimeout(() => {
  console.log('\n6. Verifying synchronization:');
  console.log(`   Admin messages received: ${adminMessages.length}`);
  console.log(`   Client messages received: ${clientMessages.length}`);
  
  if (clientMessages.length > 0) {
    console.log('   ✓ Client received the ticket update from admin');
  } else {
    console.log('   ✗ Client did not receive the ticket update');
  }
  
  console.log('\n7. Testing disconnections...');
  adminConnection.close();
  clientConnection.close();
  
  const finalStats = server.getStats();
  console.log(`   Final connected clients: ${finalStats.clientCount}`);
  
  console.log('\n=== Real-time Sync Test Completed ===');
}, 100);