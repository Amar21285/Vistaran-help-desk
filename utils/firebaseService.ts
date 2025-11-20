import { db } from '../src/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { Ticket, User, Technician, Symptom, ManagedFile, TicketTemplate } from '../types';

// Add network status tracking
let isFirebaseConnected = true;
const firebaseConnectionListeners: Array<(connected: boolean) => void> = [];

// Check if db is initialized
const isDbInitialized = () => {
  return db !== undefined;
};

// Collection names
const COLLECTIONS = {
  TICKETS: 'tickets',
  USERS: 'users',
  TECHNICIANS: 'technicians',
  SYMPTOMS: 'symptoms',
  FILES: 'files',
  TEMPLATES: 'templates'
};

// Firebase connection monitoring
export const addFirebaseConnectionListener = (callback: (connected: boolean) => void) => {
  firebaseConnectionListeners.push(callback);
};

export const removeFirebaseConnectionListener = (callback: (connected: boolean) => void) => {
  const index = firebaseConnectionListeners.indexOf(callback);
  if (index > -1) {
    firebaseConnectionListeners.splice(index, 1);
  }
};

// Monitor Firebase connection
let connectionMonitor: any;
export const startFirebaseConnectionMonitor = () => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    return;
  }
  
  if (connectionMonitor) return;
  
  connectionMonitor = setInterval(async () => {
    try {
      // Simple connectivity test
      await getDocs(query(collection(db, COLLECTIONS.TICKETS), where('id', '==', 'test')));
      if (!isFirebaseConnected) {
        isFirebaseConnected = true;
        firebaseConnectionListeners.forEach(callback => callback(true));
      }
    } catch (error) {
      if (isFirebaseConnected) {
        isFirebaseConnected = false;
        firebaseConnectionListeners.forEach(callback => callback(false));
      }
    }
  }, 10000); // Check every 10 seconds
};

export const stopFirebaseConnectionMonitor = () => {
  if (connectionMonitor) {
    clearInterval(connectionMonitor);
    connectionMonitor = null;
  }
};

// Ticket operations
export const createTicket = async (ticket: Omit<Ticket, 'id'>) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.TICKETS), ticket);
    return { id: docRef.id, ...ticket };
  } catch (error) {
    console.error('Error creating ticket:', error);
    // If offline, store in local storage as backup
    if (!navigator.onLine) {
      const offlineTickets = JSON.parse(localStorage.getItem('offline-tickets') || '[]');
      const offlineTicket = { ...ticket, id: `offline-${Date.now()}`, offline: true };
      localStorage.setItem('offline-tickets', JSON.stringify([...offlineTickets, offlineTicket]));
      return offlineTicket;
    }
    throw error;
  }
};

export const getTickets = async () => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    return [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TICKETS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
};

export const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  try {
    const ticketRef = doc(db, COLLECTIONS.TICKETS, ticketId);
    await updateDoc(ticketRef, updates);
    return { id: ticketId, ...updates };
  } catch (error) {
    console.error('Error updating ticket:', error);
    // If offline, store update for later
    if (!navigator.onLine) {
      const offlineUpdates = JSON.parse(localStorage.getItem('offline-updates') || '[]');
      const offlineUpdate = { ticketId, updates, timestamp: Date.now() };
      localStorage.setItem('offline-updates', JSON.stringify([...offlineUpdates, offlineUpdate]));
      return { id: ticketId, ...updates };
    }
    throw error;
  }
};

export const deleteTicket = async (ticketId: string) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  try {
    await deleteDoc(doc(db, COLLECTIONS.TICKETS, ticketId));
    return ticketId;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    // If offline, store deletion for later
    if (!navigator.onLine) {
      const offlineDeletions = JSON.parse(localStorage.getItem('offline-deletions') || '[]');
      localStorage.setItem('offline-deletions', JSON.stringify([...offlineDeletions, ticketId]));
      return ticketId;
    }
    throw error;
  }
};

// Real-time listeners
export const listenToTickets = (callback: (tickets: Ticket[]) => void) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    // Return a no-op function
    return () => {};
  }
  
  // Try to order by dateCreated, but fall back to no ordering if field doesn't exist
  try {
    const q = query(collection(db, COLLECTIONS.TICKETS), orderBy('dateCreated', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      // Include offline tickets if any
      const offlineTickets = JSON.parse(localStorage.getItem('offline-tickets') || '[]');
      callback([...tickets, ...offlineTickets]);
    }, (error) => {
      console.error('Error listening to tickets with ordering:', error);
      // Fallback to query without ordering
      const fallbackQ = query(collection(db, COLLECTIONS.TICKETS));
      return onSnapshot(fallbackQ, (fallbackQuerySnapshot) => {
        const tickets = fallbackQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
        // Include offline tickets if any
        const offlineTickets = JSON.parse(localStorage.getItem('offline-tickets') || '[]');
        callback([...tickets, ...offlineTickets]);
      }, (fallbackError) => {
        console.error('Error listening to tickets without ordering:', fallbackError);
      });
    });
  } catch (error) {
    console.error('Error setting up ticket listener:', error);
    // Fallback to query without ordering
    const q = query(collection(db, COLLECTIONS.TICKETS));
    return onSnapshot(q, (querySnapshot) => {
      const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      // Include offline tickets if any
      const offlineTickets = JSON.parse(localStorage.getItem('offline-tickets') || '[]');
      callback([...tickets, ...offlineTickets]);
    }, (error) => {
      console.error('Error listening to tickets:', error);
    });
  }
};

export const listenToUserTickets = (userId: string, callback: (tickets: Ticket[]) => void) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    // Return a no-op function
    return () => {};
  }
  
  // Try to order by dateCreated, but fall back if field doesn't exist
  try {
    const q = query(
      collection(db, COLLECTIONS.TICKETS), 
      where('userId', '==', userId),
      orderBy('dateCreated', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      // Include offline tickets for this user if any
      const offlineTickets = JSON.parse(localStorage.getItem('offline-tickets') || '[]')
        .filter((ticket: any) => ticket.userId === userId);
      callback([...tickets, ...offlineTickets]);
    }, (error) => {
      console.error('Error listening to user tickets with ordering:', error);
      // Fallback to query without ordering
      const fallbackQ = query(
        collection(db, COLLECTIONS.TICKETS), 
        where('userId', '==', userId)
      );
      return onSnapshot(fallbackQ, (fallbackQuerySnapshot) => {
        const tickets = fallbackQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
        // Include offline tickets for this user if any
        const offlineTickets = JSON.parse(localStorage.getItem('offline-tickets') || '[]')
          .filter((ticket: any) => ticket.userId === userId);
        callback([...tickets, ...offlineTickets]);
      }, (fallbackError) => {
        console.error('Error listening to user tickets without ordering:', fallbackError);
      });
    });
  } catch (error) {
    console.error('Error setting up user ticket listener:', error);
    // Fallback to query without ordering
    const q = query(
      collection(db, COLLECTIONS.TICKETS), 
      where('userId', '==', userId)
    );
    return onSnapshot(q, (querySnapshot) => {
      const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      // Include offline tickets for this user if any
      const offlineTickets = JSON.parse(localStorage.getItem('offline-tickets') || '[]')
        .filter((ticket: any) => ticket.userId === userId);
      callback([...tickets, ...offlineTickets]);
    }, (error) => {
      console.error('Error listening to user tickets:', error);
    });
  }
};

// User operations
export const getUsers = async () => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    // Return cached users if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-users') || '[]');
    }
    return [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    console.error('Error fetching users:', error);
    // Return cached users if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-users') || '[]');
    }
    throw error;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, updates);
    return { id: userId, ...updates };
  } catch (error) {
    console.error('Error updating user:', error);
    // If offline, store update for later
    if (!navigator.onLine) {
      const offlineUserUpdates = JSON.parse(localStorage.getItem('offline-user-updates') || '[]');
      const offlineUpdate = { userId, updates, timestamp: Date.now() };
      localStorage.setItem('offline-user-updates', JSON.stringify([...offlineUserUpdates, offlineUpdate]));
      return { id: userId, ...updates };
    }
    throw error;
  }
};

// Technician operations
export const getTechnicians = async () => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    // Return cached technicians if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-technicians') || '[]');
    }
    return [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TECHNICIANS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician));
  } catch (error) {
    console.error('Error fetching technicians:', error);
    // Return cached technicians if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-technicians') || '[]');
    }
    throw error;
  }
};

// Symptom operations
export const getSymptoms = async () => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    // Return cached symptoms if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-symptoms') || '[]');
    }
    return [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.SYMPTOMS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Symptom));
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    // Return cached symptoms if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-symptoms') || '[]');
    }
    throw error;
  }
};

// File operations
export const getFiles = async () => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    // Return cached files if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-files') || '[]');
    }
    return [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.FILES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManagedFile));
  } catch (error) {
    console.error('Error fetching files:', error);
    // Return cached files if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-files') || '[]');
    }
    throw error;
  }
};

// Template operations
export const getTemplates = async () => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    // Return cached templates if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-templates') || '[]');
    }
    return [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TEMPLATES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketTemplate));
  } catch (error) {
    console.error('Error fetching templates:', error);
    // Return cached templates if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-templates') || '[]');
    }
    throw error;
  }
};