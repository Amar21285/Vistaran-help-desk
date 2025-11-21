import { useState, useEffect } from 'react';
import { databaseService, initializeDatabase } from '../utils/database';
import type { Ticket, User, Technician, Symptom, TicketTemplate, ManagedFile } from '../types';

export const useDatabase = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        setIsLoading(true);
        const connected = await initializeDatabase();
        setIsConnected(connected);
        
        // Update the UI to show the actual connection status
        const statusElement = document.getElementById('database-status');
        if (statusElement) {
          statusElement.textContent = connected ? 'Connected (MySQL)' : 'Disconnected';
          statusElement.className = connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to database');
        const statusElement = document.getElementById('database-status');
        if (statusElement) {
          statusElement.textContent = 'Disconnected';
          statusElement.className = 'text-red-600 dark:text-red-400';
        }
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  // Data operations
  const fetchTickets = async (): Promise<Ticket[]> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.getTickets();
  };

  const saveTickets = async (tickets: Ticket[]): Promise<boolean> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.saveTickets(tickets);
  };

  const fetchUsers = async (): Promise<User[]> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.getUsers();
  };

  const saveUsers = async (users: User[]): Promise<boolean> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.saveUsers(users);
  };

  const fetchTechnicians = async (): Promise<Technician[]> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.getTechnicians();
  };

  const saveTechnicians = async (technicians: Technician[]): Promise<boolean> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.saveTechnicians(technicians);
  };

  const fetchSymptoms = async (): Promise<Symptom[]> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.getSymptoms();
  };

  const saveSymptoms = async (symptoms: Symptom[]): Promise<boolean> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.saveSymptoms(symptoms);
  };

  const fetchTemplates = async (): Promise<TicketTemplate[]> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.getTemplates();
  };

  const saveTemplates = async (templates: TicketTemplate[]): Promise<boolean> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.saveTemplates(templates);
  };

  const fetchFiles = async (): Promise<ManagedFile[]> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.getFiles();
  };

  const saveFiles = async (files: ManagedFile[]): Promise<boolean> => {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    return await databaseService.saveFiles(files);
  };

  return {
    isConnected,
    isLoading,
    error,
    fetchTickets,
    saveTickets,
    fetchUsers,
    saveUsers,
    fetchTechnicians,
    saveTechnicians,
    fetchSymptoms,
    saveSymptoms,
    fetchTemplates,
    saveTemplates,
    fetchFiles,
    saveFiles
  };
};

export default useDatabase;