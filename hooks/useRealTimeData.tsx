import { useState, useEffect, useCallback } from 'react';
import type { Ticket, User, Technician, Symptom, ManagedFile, TicketTemplate } from '../types';

interface RealTimeData {
  tickets: Ticket[];
  users: User[];
  technicians: Technician[];
  symptoms: Symptom[];
  files: ManagedFile[];
  templates: TicketTemplate[];
}

interface UseRealTimeDataProps {
  pollingInterval?: number; // in milliseconds, default 5000 (5 seconds)
  enabled?: boolean; // whether to enable real-time updates
}

/**
 * Custom hook for implementing real-time data synchronization
 * This is a polling-based solution for the current frontend-only architecture
 * 
 * @param props Configuration options for the real-time data hook
 * @returns Real-time data and control functions
 */
export const useRealTimeData = (props: UseRealTimeDataProps = {}) => {
  const { pollingInterval = 5000, enabled = true } = props;
  
  // State for real-time data
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    tickets: [],
    users: [],
    technicians: [],
    symptoms: [],
    files: [],
    templates: []
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
      // In a real implementation, this would fetch from an API
      // For now, we'll simulate by reading from localStorage
      const tickets = JSON.parse(localStorage.getItem('vistaran-helpdesk-tickets') || '[]');
      const users = JSON.parse(localStorage.getItem('vistaran-helpdesk-users') || '[]');
      const technicians = JSON.parse(localStorage.getItem('vistaran-helpdesk-technicians') || '[]');
      const symptoms = JSON.parse(localStorage.getItem('vistaran-helpdesk-symptoms') || '[]');
      const files = JSON.parse(localStorage.getItem('vistaran-helpdesk-files') || '[]');
      const templates = JSON.parse(localStorage.getItem('vistaran-helpdesk-templates') || '[]');
      
      setRealTimeData({
        tickets,
        users,
        technicians,
        symptoms,
        files,
        templates
      });
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError('Failed to fetch real-time data');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);
  
  /**
   * Set up polling for real-time updates
   */
  useEffect(() => {
    if (!enabled) return;
    
    // Initial data load
    refreshData();
    
    // Set up polling interval
    const intervalId = setInterval(() => {
      refreshData();
    }, pollingInterval);
    
    // Clean up interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshData, pollingInterval, enabled]);
  
  /**
   * Listen for localStorage changes (for same-tab updates)
   */
  useEffect(() => {
    if (!enabled) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('vistaran-helpdesk-')) {
        refreshData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshData, enabled]);
  
  return {
    ...realTimeData,
    isLoading,
    error,
    refreshData
  };
};