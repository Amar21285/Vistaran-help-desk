import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { Ticket, User } from '../types';

// Track sync status
let isSyncing = false;
let lastSyncTime = 0;
let syncRetryCount = 0;
const MAX_SYNC_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds
const MAX_RETRY_DELAY = 30000; // 30 seconds

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
  if (!navigator.onLine || isSyncing) return;
  
  // Prevent too frequent syncs
  const now = Date.now();
  if (now - lastSyncTime < 5000) return; // Minimum 5 seconds between syncs
  
  isSyncing = true;
  lastSyncTime = now;
  
  try {
    const offlineTickets = JSON.parse(localStorage.getItem('offline-tickets') || '[]');
    
    if (offlineTickets.length > 0) {
      console.log(`Syncing ${offlineTickets.length} offline tickets...`);
      
      for (const ticket of offlineTickets) {
        if (ticket.offline) {
          try {
            // Remove the offline flag and create in Firestore
            const { offline, ...ticketData } = ticket;
            const docRef = await addDoc(collection(db, COLLECTIONS.TICKETS), ticketData);
            console.log(`Synced ticket ${ticket.id} to Firestore with ID ${docRef.id}`);
          } catch (error) {
            console.error(`Error syncing ticket ${ticket.id}:`, error);
            // If it's a network error, we might want to retry
            if (syncRetryCount < MAX_SYNC_RETRIES && (
              (error as any).code === 'unavailable' || 
              (error as any).code === 'deadline-exceeded' ||
              !navigator.onLine
            )) {
              syncRetryCount++;
              console.log(`Retrying sync for ticket ${ticket.id} (${syncRetryCount}/${MAX_SYNC_RETRIES})`);
              // Exponential backoff
              const delay = Math.min(RETRY_DELAY * Math.pow(2, syncRetryCount), MAX_RETRY_DELAY);
              await new Promise(resolve => setTimeout(resolve, delay));
              // We'll retry on the next sync cycle
              continue;
            }
          }
        }
      }
      
      // Clear offline tickets after successful sync
      localStorage.removeItem('offline-tickets');
      console.log('Offline tickets synced successfully');
      syncRetryCount = 0; // Reset retry count on success
    }
  } catch (error) {
    console.error('Error syncing offline tickets:', error);
  } finally {
    isSyncing = false;
  }
};

// Sync offline ticket updates when online
export const syncOfflineUpdates = async () => {
  if (!navigator.onLine || isSyncing) return;
  
  // Prevent too frequent syncs
  const now = Date.now();
  if (now - lastSyncTime < 5000) return; // Minimum 5 seconds between syncs
  
  isSyncing = true;
  lastSyncTime = now;
  
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
          // If it's a network error, we might want to retry
          if (syncRetryCount < MAX_SYNC_RETRIES && (
            (error as any).code === 'unavailable' || 
            (error as any).code === 'deadline-exceeded' ||
            !navigator.onLine
          )) {
            syncRetryCount++;
            console.log(`Retrying sync for ticket ${update.ticketId} (${syncRetryCount}/${MAX_SYNC_RETRIES})`);
            // Exponential backoff
            const delay = Math.min(RETRY_DELAY * Math.pow(2, syncRetryCount), MAX_RETRY_DELAY);
            await new Promise(resolve => setTimeout(resolve, delay));
            // We'll retry on the next sync cycle
            continue;
          }
        }
      }
      
      // Clear offline updates after successful sync
      localStorage.removeItem('offline-updates');
      console.log('Offline ticket updates synced successfully');
      syncRetryCount = 0; // Reset retry count on success
    }
  } catch (error) {
    console.error('Error syncing offline updates:', error);
  } finally {
    isSyncing = false;
  }
};

// Sync offline ticket deletions when online
export const syncOfflineDeletions = async () => {
  if (!navigator.onLine || isSyncing) return;
  
  // Prevent too frequent syncs
  const now = Date.now();
  if (now - lastSyncTime < 5000) return; // Minimum 5 seconds between syncs
  
  isSyncing = true;
  lastSyncTime = now;
  
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
          // If it's a network error, we might want to retry
          if (syncRetryCount < MAX_SYNC_RETRIES && (
            (error as any).code === 'unavailable' || 
            (error as any).code === 'deadline-exceeded' ||
            !navigator.onLine
          )) {
            syncRetryCount++;
            console.log(`Retrying sync for ticket ${ticketId} (${syncRetryCount}/${MAX_SYNC_RETRIES})`);
            // Exponential backoff
            const delay = Math.min(RETRY_DELAY * Math.pow(2, syncRetryCount), MAX_RETRY_DELAY);
            await new Promise(resolve => setTimeout(resolve, delay));
            // We'll retry on the next sync cycle
            continue;
          }
        }
      }
      
      // Clear offline deletions after successful sync
      localStorage.removeItem('offline-deletions');
      console.log('Offline ticket deletions synced successfully');
      syncRetryCount = 0; // Reset retry count on success
    }
  } catch (error) {
    console.error('Error syncing offline deletions:', error);
  } finally {
    isSyncing = false;
  }
};

// Sync offline user updates when online
export const syncOfflineUserUpdates = async () => {
  if (!navigator.onLine || isSyncing) return;
  
  // Prevent too frequent syncs
  const now = Date.now();
  if (now - lastSyncTime < 5000) return; // Minimum 5 seconds between syncs
  
  isSyncing = true;
  lastSyncTime = now;
  
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
          // If it's a network error, we might want to retry
          if (syncRetryCount < MAX_SYNC_RETRIES && (
            (error as any).code === 'unavailable' || 
            (error as any).code === 'deadline-exceeded' ||
            !navigator.onLine
          )) {
            syncRetryCount++;
            console.log(`Retrying sync for user ${update.userId} (${syncRetryCount}/${MAX_SYNC_RETRIES})`);
            // Exponential backoff
            const delay = Math.min(RETRY_DELAY * Math.pow(2, syncRetryCount), MAX_RETRY_DELAY);
            await new Promise(resolve => setTimeout(resolve, delay));
            // We'll retry on the next sync cycle
            continue;
          }
        }
      }
      
      // Clear offline user updates after successful sync
      localStorage.removeItem('offline-user-updates');
      console.log('Offline user updates synced successfully');
      syncRetryCount = 0; // Reset retry count on success
    }
  } catch (error) {
    console.error('Error syncing offline user updates:', error);
  } finally {
    isSyncing = false;
  }
};

// Cache data for offline use
export const cacheDataForOffline = async () => {
  try {
    // Get current data from localStorage as fallback
    const cachedUsers = localStorage.getItem('vistaran-helpdesk-users');
    const cachedTickets = localStorage.getItem('vistaran-helpdesk-tickets');
    const cachedTechnicians = localStorage.getItem('vistaran-helpdesk-technicians');
    const cachedSymptoms = localStorage.getItem('vistaran-helpdesk-symptoms');
    const cachedFiles = localStorage.getItem('vistaran-helpdesk-files');
    const cachedTemplates = localStorage.getItem('vistaran-helpdesk-templates');
    
    // Store in separate cache keys for offline use
    if (cachedUsers) localStorage.setItem('cached-users', cachedUsers);
    if (cachedTickets) localStorage.setItem('cached-tickets', cachedTickets);
    if (cachedTechnicians) localStorage.setItem('cached-technicians', cachedTechnicians);
    if (cachedSymptoms) localStorage.setItem('cached-symptoms', cachedSymptoms);
    if (cachedFiles) localStorage.setItem('cached-files', cachedFiles);
    if (cachedTemplates) localStorage.setItem('cached-templates', cachedTemplates);
    
    console.log('Data cached for offline use');
  } catch (error) {
    console.error('Error caching data for offline use:', error);
  }
};

// Initialize offline sync service
export const initOfflineSync = () => {
  // Sync when online status changes
  window.addEventListener('online', () => {
    console.log('Online detected, syncing offline data...');
    syncRetryCount = 0; // Reset retry count when coming online
    
    // Immediate sync when coming online
    setTimeout(() => {
      syncOfflineTickets();
      syncOfflineUpdates();
      syncOfflineDeletions();
      syncOfflineUserUpdates();
    }, 1000); // Small delay to ensure connection is stable
  });
  
  // Handle offline status
  window.addEventListener('offline', () => {
    console.log('Offline detected, queuing operations...');
    // Store current state for offline use
    cacheDataForOffline();
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
  } else {
    // If starting offline, cache data for offline use
    setTimeout(() => {
      cacheDataForOffline();
    }, 1000);
  }
  
  console.log('Offline sync service initialized');
};