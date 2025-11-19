import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { Ticket, User } from '../types';

// Collection names
const COLLECTIONS = {
  TICKETS: 'tickets',
  USERS: 'users',
  TECHNICIANS: 'technicians',
  SYMPTOMS: 'symptoms',
  FILES: 'files',
  TEMPLATES: 'templates'
};

// Sync offline tickets when online
export const syncOfflineTickets = async () => {
  if (!navigator.onLine) return;
  
  try {
    const offlineTickets = JSON.parse(localStorage.getItem('offline-tickets') || '[]');
    
    if (offlineTickets.length > 0) {
      console.log(`Syncing ${offlineTickets.length} offline tickets...`);
      
      for (const ticket of offlineTickets) {
        if (ticket.offline) {
          // Remove the offline flag and create in Firestore
          const { offline, ...ticketData } = ticket;
          const docRef = await addDoc(collection(db, COLLECTIONS.TICKETS), ticketData);
          console.log(`Synced ticket ${ticket.id} to Firestore with ID ${docRef.id}`);
        }
      }
      
      // Clear offline tickets after successful sync
      localStorage.removeItem('offline-tickets');
      console.log('Offline tickets synced successfully');
    }
  } catch (error) {
    console.error('Error syncing offline tickets:', error);
  }
};

// Sync offline ticket updates when online
export const syncOfflineUpdates = async () => {
  if (!navigator.onLine) return;
  
  try {
    const offlineUpdates = JSON.parse(localStorage.getItem('offline-updates') || '[]');
    
    if (offlineUpdates.length > 0) {
      console.log(`Syncing ${offlineUpdates.length} offline ticket updates...`);
      
      for (const update of offlineUpdates) {
        try {
          const ticketRef = doc(db, COLLECTIONS.TICKETS, update.ticketId);
          await updateDoc(ticketRef, update.updates);
          console.log(`Synced update for ticket ${update.ticketId}`);
        } catch (error) {
          console.error(`Error syncing update for ticket ${update.ticketId}:`, error);
        }
      }
      
      // Clear offline updates after successful sync
      localStorage.removeItem('offline-updates');
      console.log('Offline ticket updates synced successfully');
    }
  } catch (error) {
    console.error('Error syncing offline updates:', error);
  }
};

// Sync offline ticket deletions when online
export const syncOfflineDeletions = async () => {
  if (!navigator.onLine) return;
  
  try {
    const offlineDeletions = JSON.parse(localStorage.getItem('offline-deletions') || '[]');
    
    if (offlineDeletions.length > 0) {
      console.log(`Syncing ${offlineDeletions.length} offline ticket deletions...`);
      
      for (const ticketId of offlineDeletions) {
        try {
          const ticketRef = doc(db, COLLECTIONS.TICKETS, ticketId);
          await deleteDoc(ticketRef);
          console.log(`Synced deletion for ticket ${ticketId}`);
        } catch (error) {
          console.error(`Error syncing deletion for ticket ${ticketId}:`, error);
        }
      }
      
      // Clear offline deletions after successful sync
      localStorage.removeItem('offline-deletions');
      console.log('Offline ticket deletions synced successfully');
    }
  } catch (error) {
    console.error('Error syncing offline deletions:', error);
  }
};

// Sync offline user updates when online
export const syncOfflineUserUpdates = async () => {
  if (!navigator.onLine) return;
  
  try {
    const offlineUserUpdates = JSON.parse(localStorage.getItem('offline-user-updates') || '[]');
    
    if (offlineUserUpdates.length > 0) {
      console.log(`Syncing ${offlineUserUpdates.length} offline user updates...`);
      
      for (const update of offlineUserUpdates) {
        try {
          const userRef = doc(db, COLLECTIONS.USERS, update.userId);
          await updateDoc(userRef, update.updates);
          console.log(`Synced update for user ${update.userId}`);
        } catch (error) {
          console.error(`Error syncing update for user ${update.userId}:`, error);
        }
      }
      
      // Clear offline user updates after successful sync
      localStorage.removeItem('offline-user-updates');
      console.log('Offline user updates synced successfully');
    }
  } catch (error) {
    console.error('Error syncing offline user updates:', error);
  }
};

// Cache data for offline use
export const cacheDataForOffline = () => {
  // This would be called periodically to cache data
  // In a real implementation, you would fetch data and store it in localStorage
  console.log('Caching data for offline use...');
};

// Initialize offline sync service
export const initOfflineSync = () => {
  // Sync when online status changes
  window.addEventListener('online', () => {
    console.log('Online detected, syncing offline data...');
    syncOfflineTickets();
    syncOfflineUpdates();
    syncOfflineDeletions();
    syncOfflineUserUpdates();
  });
  
  // Periodically check and sync when online
  setInterval(() => {
    if (navigator.onLine) {
      syncOfflineTickets();
      syncOfflineUpdates();
      syncOfflineDeletions();
      syncOfflineUserUpdates();
    }
  }, 30000); // Check every 30 seconds
  
  // Initial sync when app starts
  if (navigator.onLine) {
    setTimeout(() => {
      syncOfflineTickets();
      syncOfflineUpdates();
      syncOfflineDeletions();
      syncOfflineUserUpdates();
    }, 5000); // Wait 5 seconds after app start
  }
  
  console.log('Offline sync service initialized');
};