import { useState, useEffect, useCallback } from 'react';
import { 
  listenToTickets, 
  listenToUsers,
  listenToTechnicians,
  getTickets, 
  getUsers, 
  getTechnicians, 
  getSymptoms, 
  getFiles, 
  getTemplates,
  addFirebaseConnectionListener,
  removeFirebaseConnectionListener,
  startFirebaseConnectionMonitor,
  stopFirebaseConnectionMonitor
} from '../utils/firebaseService';
import type { Ticket, User, Technician, Symptom, ManagedFile, TicketTemplate } from '../types';

interface FirebaseData {
  tickets: Ticket[];
  users: User[];
  technicians: Technician[];
  symptoms: Symptom[];
  files: ManagedFile[];
  templates: TicketTemplate[];
}

interface UseFirebaseDataProps {
  enabled?: boolean; // whether to enable real-time updates
}

interface DebugInfo {
  initialized: boolean;
  ticketsListenerActive: boolean;
  usersListenerActive: boolean;
  techniciansListenerActive: boolean;
  symptomsListenerActive: boolean;
  filesListenerActive: boolean;
  templatesListenerActive: boolean;
  dataFetchAttempts: number;
  firebaseConnected: boolean;
}

/**
 * Custom hook for implementing real-time data synchronization with Firebase
 * 
 * @param props Configuration options for the Firebase data hook
 * @returns Real-time data and control functions
 */
export const useFirebaseData = (props: UseFirebaseDataProps = {}) => {
  const { enabled = true } = props;
  
  // State for Firebase data
  const [firebaseData, setFirebaseData] = useState<FirebaseData>({
    tickets: [],
    users: [],
    technicians: [],
    symptoms: [],
    files: [],
    templates: []
  });
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    initialized: false,
    ticketsListenerActive: false,
    usersListenerActive: false,
    techniciansListenerActive: false,
    symptomsListenerActive: false,
    filesListenerActive: false,
    templatesListenerActive: false,
    dataFetchAttempts: 0,
    firebaseConnected: true
  });
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Function to manually trigger a data refresh
   */
  const refreshData = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all data from Firebase
      const [tickets, users, technicians, symptoms, files, templates] = await Promise.all([
        getTickets(),
        getUsers(),
        getTechnicians(),
        getSymptoms(),
        getFiles(),
        getTemplates()
      ]);
      
      setFirebaseData({
        tickets,
        users,
        technicians,
        symptoms,
        files,
        templates
      });
    } catch (err) {
      console.error('Error fetching Firebase data:', err);
      setError('Failed to fetch data from Firebase: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);
  
  /**
   * Set up real-time listeners for Firebase data
   */
  useEffect(() => {
    if (!enabled) return;
    
    // Start Firebase connection monitor
    startFirebaseConnectionMonitor();
    
    // Add connection listener
    const handleConnectionChange = (connected: boolean) => {
      // Less verbose logging
      // console.log('Firebase connection status changed:', connected);
      setDebugInfo(prev => ({ ...prev, firebaseConnected: connected }));
      
      // If we just reconnected, refresh data
      if (connected) {
        refreshData();
      }
    };
    
    addFirebaseConnectionListener(handleConnectionChange);
    
    // Initial data load
    refreshData();
    
    // Set up real-time listeners
    console.log('Setting up Firebase listeners...');
    setDebugInfo(prev => ({ ...prev, initialized: true }));
    
    const unsubscribeTickets = listenToTickets((tickets) => {
      // Less verbose logging
      // console.log('Received tickets update from Firebase:', tickets.length);
      setFirebaseData(prev => ({ ...prev, tickets }));
      setDebugInfo(prev => ({ ...prev, ticketsListenerActive: true }));
    });
    
    // Set up real-time listeners for users and technicians which are critical for admin/client sync
    const unsubscribeUsers = listenToUsers((users) => {
      // Less verbose logging
      // console.log('Received users update from Firebase:', users.length);
      setFirebaseData(prev => ({ ...prev, users }));
      setDebugInfo(prev => ({ ...prev, usersListenerActive: true }));
    });
    
    const unsubscribeTechnicians = listenToTechnicians((technicians) => {
      // Less verbose logging
      // console.log('Received technicians update from Firebase:', technicians.length);
      setFirebaseData(prev => ({ ...prev, technicians }));
      setDebugInfo(prev => ({ ...prev, techniciansListenerActive: true }));
    });
    
    // We'll fetch other data periodically but with a shorter interval for better sync
    const intervalId = setInterval(() => {
      // Refresh non-ticket data periodically (less verbose logging)
      // console.log('Refreshing non-ticket data from Firebase...');
      setDebugInfo(prev => ({ ...prev, dataFetchAttempts: prev.dataFetchAttempts + 1 }));
      
      Promise.all([
        getSymptoms(),
        getFiles(),
        getTemplates()
      ]).then(([symptoms, files, templates]) => {
        // Less verbose logging
        // console.log('Received non-ticket data from Firebase');
        setFirebaseData(prev => ({
          ...prev,
          symptoms,
          files,
          templates
        }));
      }).catch(err => {
        console.error('Error refreshing non-ticket data:', err);
      });
    }, 60000); // Refresh non-ticket data every 60 seconds to reduce network usage
    
    // Clean up listeners on unmount
    return () => {
      console.log('Cleaning up Firebase listeners...');
      unsubscribeTickets();
      unsubscribeUsers();
      unsubscribeTechnicians();
      clearInterval(intervalId);
      removeFirebaseConnectionListener(handleConnectionChange);
      stopFirebaseConnectionMonitor();
    };
  }, [refreshData, enabled]);
  
  return {
    ...firebaseData,
    isLoading,
    error,
    refreshData,
    debugInfo
  };
};