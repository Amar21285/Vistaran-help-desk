import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { User, Ticket, Technician, Symptom, Status, Role } from '../types';
import { initialUsers, initialTickets, initialSymptoms, initialTechnicians } from '../services/mockData';

interface DataContextType {
  users: User[];
  tickets: Ticket[];
  technicians: Technician[];
  symptoms: Symptom[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  addTicket: (ticket: Omit<Ticket, 'id' | 'dateCreated' | 'status'>) => void;
  updateTicket: (ticket: Ticket) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('helpdesk-users', initialUsers);
  const [tickets, setTickets] = useLocalStorage<Ticket[]>('helpdesk-tickets', initialTickets);
  const [symptoms] = useState<Symptom[]>(initialSymptoms);
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);

  useEffect(() => {
    setTechnicians(users.filter(user => user.role === Role.TECHNICIAN));
  }, [users]);
  
  const addUser = useCallback((userData: Omit<User, 'id'>) => {
    setUsers(prevUsers => [
        ...prevUsers,
        { ...userData, id: `user-${Date.now()}` }
    ]);
  }, [setUsers]);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user));
  }, [setUsers]);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  }, [setUsers]);

  const addTicket = useCallback((ticketData: Omit<Ticket, 'id' | 'dateCreated' | 'status'>) => {
    const newTicket: Ticket = {
      ...ticketData,
      id: `ticket-${Date.now()}`,
      dateCreated: new Date().toISOString(),
      status: Status.OPEN
    };
    setTickets(prevTickets => [newTicket, ...prevTickets]);
  }, [setTickets]);

  const updateTicket = useCallback((updatedTicket: Ticket) => {
    setTickets(prevTickets => prevTickets.map(ticket => ticket.id === updatedTicket.id ? updatedTicket : ticket));
  }, [setTickets]);

  return (
    <DataContext.Provider value={{ users, tickets, technicians, symptoms, addUser, updateUser, deleteUser, addTicket, updateTicket }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
