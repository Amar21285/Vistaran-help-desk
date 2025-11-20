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
import type { Ticket, User, Technician, Symptom, ManagedFile, TicketTemplate } from '../types';

// Add network status tracking
let isFirebaseConnected = true;
let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 second
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

// Enhanced connection monitor with retry logic
let connectionMonitor: any;
export const startFirebaseConnectionMonitor = () => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    return;
  }
  
  if (connectionMonitor) return;
  
  const checkConnection = async () => {
    try {
      // Simple connectivity test
      await getDocs(query(collection(db, COLLECTIONS.TICKETS), where('id', '==', 'test')));
      
      // Reset retry count on successful connection
      connectionRetryCount = 0;
      
      if (!isFirebaseConnected) {
        isFirebaseConnected = true;
        firebaseConnectionListeners.forEach(callback => callback(true));
      }
    } catch (error) {
      // Only log connection errors once per session to reduce noise
      // console.error('Firebase connection error:', error);
      
      // Implement exponential backoff retry logic
      if (connectionRetryCount < MAX_RETRY_ATTEMPTS) {
        connectionRetryCount++;
        const delay = RETRY_DELAY_BASE * Math.pow(2, connectionRetryCount - 1);
        
        // Less verbose logging
        // console.log(`Retrying Firebase connection in ${delay}ms (attempt ${connectionRetryCount}/${MAX_RETRY_ATTEMPTS})`);
        
        setTimeout(checkConnection, delay);
        return;
      }
      
      if (isFirebaseConnected) {
        isFirebaseConnected = false;
        firebaseConnectionListeners.forEach(callback => callback(false));
      }
    }
  };
  
  // Initial check
  checkConnection();
  
  // Set up periodic monitoring (less frequent to reduce resource usage)
  connectionMonitor = setInterval(checkConnection, 30000); // Check every 30 seconds
};

export const stopFirebaseConnectionMonitor = () => {
  if (connectionMonitor) {
    clearInterval(connectionMonitor);
    connectionMonitor = null;
  }
};

// Enhanced Firebase operations with retry logic
const withRetry = async <T>(operation: () => Promise<T>, operationName: string): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      // Less verbose logging for retries
      // console.error(`Attempt ${attempt} failed for ${operationName}:`, error);
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        // console.log(`Retrying ${operationName} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Operation ${operationName} failed after ${MAX_RETRY_ATTEMPTS} attempts: ${lastError.message}`);
};

// Ticket operations
export const createTicket = async (ticket: Omit<Ticket, 'id'>) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  return withRetry(async () => {
    const docRef = await addDoc(collection(db, COLLECTIONS.TICKETS), ticket);
    return { id: docRef.id, ...ticket };
  }, 'createTicket').catch(error => {
    // If offline, store in local storage as backup
    if (!navigator.onLine) {
      const offlineTickets = JSON.parse(localStorage.getItem('offline-tickets') || '[]');
      const offlineTicket = { ...ticket, id: `offline-${Date.now()}`, offline: true };
      localStorage.setItem('offline-tickets', JSON.stringify([...offlineTickets, offlineTicket]));
      return offlineTicket;
    }
    throw error;
  });
};

export const getTickets = async () => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    return [];
  }
  
  return withRetry(async () => {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TICKETS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  }, 'getTickets').catch(error => {
    // Return cached tickets if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-tickets') || '[]');
    }
    throw error;
  });
};

export const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  return withRetry(async () => {
    const ticketRef = doc(db, COLLECTIONS.TICKETS, ticketId);
    await updateDoc(ticketRef, updates);
    return { id: ticketId, ...updates };
  }, 'updateTicket').catch(error => {
    // If offline, store update for later
    if (!navigator.onLine) {
      const offlineUpdates = JSON.parse(localStorage.getItem('offline-updates') || '[]');
      const offlineUpdate = { ticketId, updates, timestamp: Date.now() };
      localStorage.setItem('offline-updates', JSON.stringify([...offlineUpdates, offlineUpdate]));
      return { id: ticketId, ...updates };
    }
    throw error;
  });
};

export const deleteTicket = async (ticketId: string) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  return withRetry(async () => {
    await deleteDoc(doc(db, COLLECTIONS.TICKETS, ticketId));
    return ticketId;
  }, 'deleteTicket').catch(error => {
    // If offline, store deletion for later
    if (!navigator.onLine) {
      const offlineDeletions = JSON.parse(localStorage.getItem('offline-deletions') || '[]');
      localStorage.setItem('offline-deletions', JSON.stringify([...offlineDeletions, ticketId]));
      return ticketId;
    }
    throw error;
  });
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
  
  return withRetry(async () => {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }, 'getUsers').catch(error => {
    // Return cached users if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-users') || '[]');
    }
    throw error;
  });
};

// Real-time listener for users
export const listenToUsers = (callback: (users: User[]) => void) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    // Return a no-op function
    return () => {};
  }
  
  const q = query(collection(db, COLLECTIONS.USERS));
  
  return onSnapshot(q, (querySnapshot) => {
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    callback(users);
  }, (error) => {
    console.error('Error listening to users:', error);
  });
};

// Create a new user
export const createUser = async (user: Omit<User, 'id'>) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  return withRetry(async () => {
    const docRef = await addDoc(collection(db, COLLECTIONS.USERS), user);
    return { id: docRef.id, ...user };
  }, 'createUser');
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  return withRetry(async () => {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, updates);
    return { id: userId, ...updates };
  }, 'updateUser').catch(error => {
    // If offline, store update for later
    if (!navigator.onLine) {
      const offlineUserUpdates = JSON.parse(localStorage.getItem('offline-user-updates') || '[]');
      const offlineUpdate = { userId, updates, timestamp: Date.now() };
      localStorage.setItem('offline-user-updates', JSON.stringify([...offlineUserUpdates, offlineUpdate]));
      return { id: userId, ...updates };
    }
    throw error;
  });
};

// Delete a user
export const deleteUser = async (userId: string) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  return withRetry(async () => {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
    return userId;
  }, 'deleteUser');
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
  
  return withRetry(async () => {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TECHNICIANS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician));
  }, 'getTechnicians').catch(error => {
    // Return cached technicians if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-technicians') || '[]');
    }
    throw error;
  });
};

// Real-time listener for technicians
export const listenToTechnicians = (callback: (technicians: Technician[]) => void) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    // Return a no-op function
    return () => {};
  }
  
  const q = query(collection(db, COLLECTIONS.TECHNICIANS));
  
  return onSnapshot(q, (querySnapshot) => {
    const technicians = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician));
    callback(technicians);
  }, (error) => {
    console.error('Error listening to technicians:', error);
  });
};

// Create a new technician
export const createTechnician = async (technician: Omit<Technician, 'id'>) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  return withRetry(async () => {
    const docRef = await addDoc(collection(db, COLLECTIONS.TECHNICIANS), technician);
    return { id: docRef.id, ...technician };
  }, 'createTechnician');
};

// Update a technician
export const updateTechnician = async (technicianId: string, updates: Partial<Technician>) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  return withRetry(async () => {
    const technicianRef = doc(db, COLLECTIONS.TECHNICIANS, technicianId);
    await updateDoc(technicianRef, updates);
    return { id: technicianId, ...updates };
  }, 'updateTechnician');
};

// Delete a technician
export const deleteTechnician = async (technicianId: string) => {
  if (!isDbInitialized()) {
    console.error('Firebase is not initialized');
    throw new Error('Firebase is not initialized');
  }
  
  return withRetry(async () => {
    await deleteDoc(doc(db, COLLECTIONS.TECHNICIANS, technicianId));
    return technicianId;
  }, 'deleteTechnician');
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
  
  return withRetry(async () => {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.SYMPTOMS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Symptom));
  }, 'getSymptoms').catch(error => {
    // Return cached symptoms if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-symptoms') || '[]');
    }
    throw error;
  });
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
  
  return withRetry(async () => {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.FILES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManagedFile));
  }, 'getFiles').catch(error => {
    // Return cached files if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-files') || '[]');
    }
    throw error;
  });
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
  
  return withRetry(async () => {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TEMPLATES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketTemplate));
  }, 'getTemplates').catch(error => {
    // Return cached templates if offline
    if (!navigator.onLine) {
      return JSON.parse(localStorage.getItem('cached-templates') || '[]');
    }
    throw error;
  });
};