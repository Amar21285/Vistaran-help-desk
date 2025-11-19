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
  orderBy 
} from 'firebase/firestore';
import { Ticket, User, Technician, Symptom, ManagedFile, TicketTemplate } from '../types';

// Collection names
const COLLECTIONS = {
  TICKETS: 'tickets',
  USERS: 'users',
  TECHNICIANS: 'technicians',
  SYMPTOMS: 'symptoms',
  FILES: 'files',
  TEMPLATES: 'templates'
};

// Ticket operations
export const createTicket = async (ticket: Omit<Ticket, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.TICKETS), ticket);
    return { id: docRef.id, ...ticket };
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

export const getTickets = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TICKETS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
};

export const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
  try {
    const ticketRef = doc(db, COLLECTIONS.TICKETS, ticketId);
    await updateDoc(ticketRef, updates);
    return { id: ticketId, ...updates };
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

export const deleteTicket = async (ticketId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TICKETS, ticketId));
    return ticketId;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
};

// Real-time listeners
export const listenToTickets = (callback: (tickets: Ticket[]) => void) => {
  // Try to order by dateCreated, but fall back to no ordering if field doesn't exist
  try {
    const q = query(collection(db, COLLECTIONS.TICKETS), orderBy('dateCreated', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      callback(tickets);
    }, (error) => {
      console.error('Error listening to tickets with ordering:', error);
      // Fallback to query without ordering
      const fallbackQ = query(collection(db, COLLECTIONS.TICKETS));
      return onSnapshot(fallbackQ, (fallbackQuerySnapshot) => {
        const tickets = fallbackQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
        callback(tickets);
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
      callback(tickets);
    }, (error) => {
      console.error('Error listening to tickets:', error);
    });
  }
};

export const listenToUserTickets = (userId: string, callback: (tickets: Ticket[]) => void) => {
  // Try to order by dateCreated, but fall back if field doesn't exist
  try {
    const q = query(
      collection(db, COLLECTIONS.TICKETS), 
      where('userId', '==', userId),
      orderBy('dateCreated', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      callback(tickets);
    }, (error) => {
      console.error('Error listening to user tickets with ordering:', error);
      // Fallback to query without ordering
      const fallbackQ = query(
        collection(db, COLLECTIONS.TICKETS), 
        where('userId', '==', userId)
      );
      return onSnapshot(fallbackQ, (fallbackQuerySnapshot) => {
        const tickets = fallbackQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
        callback(tickets);
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
      callback(tickets);
    }, (error) => {
      console.error('Error listening to user tickets:', error);
    });
  }
};

// User operations
export const getUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, updates);
    return { id: userId, ...updates };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Technician operations
export const getTechnicians = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TECHNICIANS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician));
  } catch (error) {
    console.error('Error fetching technicians:', error);
    throw error;
  }
};

// Symptom operations
export const getSymptoms = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.SYMPTOMS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Symptom));
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    throw error;
  }
};

// File operations
export const getFiles = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.FILES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManagedFile));
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
};

// Template operations
export const getTemplates = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TEMPLATES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketTemplate));
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};