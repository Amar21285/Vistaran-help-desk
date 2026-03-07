import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import useLocalStorage from './useLocalStorage';
import { User, Ticket, Technician, ManagedFile, Symptom, TicketTemplate, InventoryItem, Vendor, ReceivingChallan, Invoice, PurchaseOrder } from '../types';

interface SyncCollectionMap {
  'users': User[];
  'tickets': Ticket[];
  'technicians': Technician[];
  'files': ManagedFile[];
  'symptoms': Symptom[];
  'templates': TicketTemplate[];
  'departments': string[];
  'inventory': InventoryItem[];
  'vendors': Vendor[];
  'challans': ReceivingChallan[];
  'outward-invoices': Invoice[];
  'purchase-orders': PurchaseOrder[];
  'attendance': any[];
}

interface RealtimeSyncHook {
  isConnected: boolean;
  connect: (userId: string, role: string) => void;
  disconnect: () => void;
  triggerManualSync: (collection: keyof SyncCollectionMap) => void;
  getSyncStats: () => { clientCount: number; collections: string[] };
}

const useRealtimeSync = (): RealtimeSyncHook => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<any>(null);
  const userIdRef = useRef<string>('');

  // Import all the localStorage hooks to monitor for changes
  const [allUsers, setAllUsers] = useLocalStorage<User[]>('vistaran-helpdesk-users', []);
  const [allTickets, setAllTickets] = useLocalStorage<Ticket[]>('vistaran-helpdesk-tickets', []);
  const [allTechnicians, setAllTechnicians] = useLocalStorage<Technician[]>('vistaran-helpdesk-technicians', []);
  const [allFiles, setAllFiles] = useLocalStorage<ManagedFile[]>('vistaran-helpdesk-files', []);
  const [allSymptoms, setAllSymptoms] = useLocalStorage<Symptom[]>('vistaran-helpdesk-symptoms', []);
  const [allTemplates, setAllTemplates] = useLocalStorage<TicketTemplate[]>('vistaran-helpdesk-templates', []);
  const [allDepartments, setAllDepartments] = useLocalStorage<string[]>('vistaran-helpdesk-departments', []);
  const [allInventory, setAllInventory] = useLocalStorage<InventoryItem[]>('vistaran-helpdesk-inventory', []);
  const [allVendors, setAllVendors] = useLocalStorage<Vendor[]>('vistaran-helpdesk-vendors', []);
  const [allChallans, setAllChallans] = useLocalStorage<ReceivingChallan[]>('vistaran-helpdesk-challans', []);
  const [allInvoices, setAllInvoices] = useLocalStorage<Invoice[]>('vistaran-helpdesk-outward-invoices', []);
  const [allPurchaseOrders, setAllPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('vistaran-helpdesk-purchase-orders', []);
  const [allAttendance, setAllAttendance] = useLocalStorage<any[]>('vistaran-helpdesk-attendance', []);

  // Store the previous values to detect changes
  const prevValuesRef = useRef({
    users: JSON.stringify(allUsers),
    tickets: JSON.stringify(allTickets),
    technicians: JSON.stringify(allTechnicians),
    files: JSON.stringify(allFiles),
    symptoms: JSON.stringify(allSymptoms),
    templates: JSON.stringify(allTemplates),
    departments: JSON.stringify(allDepartments),
    inventory: JSON.stringify(allInventory),
    vendors: JSON.stringify(allVendors),
    challans: JSON.stringify(allChallans),
    invoices: JSON.stringify(allInvoices),
    purchaseOrders: JSON.stringify(allPurchaseOrders),
    attendance: JSON.stringify(allAttendance),
  });

  // Function to connect to the sync service
  const connect = useCallback((userId: string, role: string) => {
    userIdRef.current = userId;

    // Connect to Socket.IO server
    const socket = io({
      transports: ['websocket'],
      auth: {
        userId,
        role
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`Connected to sync service as ${role} user: ${userId}`);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from sync service');
      setIsConnected(false);
    });

    socket.on('data_update', (message) => {
      console.log('Received sync message:', message);
      handleIncomingMessage(message);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    setIsConnected(true);
    console.log(`Connected to sync service as ${role} user: ${userId}`);
  }, []);

  // Function to disconnect from the sync service
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    userIdRef.current = '';
  }, []);

  // Handle incoming sync messages
  const handleIncomingMessage = useCallback((message: any) => {
    if (!message || !message.type) return;

    switch (message.type) {
      case 'DATA_UPDATE':
        handleDataUpdate(message);
        break;
      case 'INITIAL_SYNC':
        handleInitialSync(message);
        break;
      case 'FULL_SYNC':
        handleFullSync(message);
        break;
      case 'HEARTBEAT_RESPONSE':
        // Ping response - connection is alive
        break;
      default:
        console.log('Unknown sync message type:', message.type);
    }
  }, []);

  // Handle data update messages
  const handleDataUpdate = useCallback((message: any) => {
    if (!message.collection || !message.data) {
      console.warn('Invalid DATA_UPDATE message:', message);
      return;
    }

    const collection = message.collection as keyof SyncCollectionMap;
    const data = message.data;

    // Update the appropriate localStorage value based on the collection
    switch (collection) {
      case 'users':
        setAllUsers(data);
        break;
      case 'tickets':
        setAllTickets(data);
        break;
      case 'technicians':
        setAllTechnicians(data);
        break;
      case 'files':
        setAllFiles(data);
        break;
      case 'symptoms':
        setAllSymptoms(data);
        break;
      case 'templates':
        setAllTemplates(data);
        break;
      case 'departments':
        setAllDepartments(data);
        break;
      case 'inventory':
        setAllInventory(data);
        break;
      case 'vendors':
        setAllVendors(data);
        break;
      case 'challans':
        setAllChallans(data);
        break;
      case 'outward-invoices':
        setAllInvoices(data);
        break;
      case 'purchase-orders':
        setAllPurchaseOrders(data);
        break;
      case 'attendance':
        setAllAttendance(data);
        break;
      default:
        console.warn('Unknown collection for sync:', collection);
    }
  }, [setAllUsers, setAllTickets, setAllTechnicians, setAllFiles, setAllSymptoms,
    setAllTemplates, setAllDepartments, setAllInventory, setAllVendors,
    setAllChallans, setAllInvoices, setAllPurchaseOrders]);

  // Handle initial sync message
  const handleInitialSync = useCallback((message: any) => {
    if (!message.data) return;

    const syncData = message.data;

    // Update all collections with initial sync data
    if (syncData.users !== undefined) setAllUsers(syncData.users);
    if (syncData.tickets !== undefined) setAllTickets(syncData.tickets);
    if (syncData.technicians !== undefined) setAllTechnicians(syncData.technicians);
    if (syncData.files !== undefined) setAllFiles(syncData.files);
    if (syncData.symptoms !== undefined) setAllSymptoms(syncData.symptoms);
    if (syncData.templates !== undefined) setAllTemplates(syncData.templates);
    if (syncData.departments !== undefined) setAllDepartments(syncData.departments);
    if (syncData.inventory !== undefined) setAllInventory(syncData.inventory);
    if (syncData.vendors !== undefined) setAllVendors(syncData.vendors);
    if (syncData.challans !== undefined) setAllChallans(syncData.challans);
    if (syncData.invoices !== undefined) setAllInvoices(syncData.invoices);
    if (syncData.purchaseOrders !== undefined) setAllPurchaseOrders(syncData.purchaseOrders);
    if (syncData.attendance !== undefined) setAllAttendance(syncData.attendance);
  }, [setAllUsers, setAllTickets, setAllTechnicians, setAllFiles, setAllSymptoms,
    setAllTemplates, setAllDepartments, setAllInventory, setAllVendors,
    setAllChallans, setAllInvoices, setAllPurchaseOrders, setAllAttendance]);

  // Handle full sync message
  const handleFullSync = useCallback(handleInitialSync, [handleInitialSync]);

  // Monitor for changes in localStorage and sync them
  useEffect(() => {
    const currentValues = {
      users: JSON.stringify(allUsers),
      tickets: JSON.stringify(allTickets),
      technicians: JSON.stringify(allTechnicians),
      files: JSON.stringify(allFiles),
      symptoms: JSON.stringify(allSymptoms),
      templates: JSON.stringify(allTemplates),
      departments: JSON.stringify(allDepartments),
      inventory: JSON.stringify(allInventory),
      vendors: JSON.stringify(allVendors),
      challans: JSON.stringify(allChallans),
      invoices: JSON.stringify(allInvoices),
      purchaseOrders: JSON.stringify(allPurchaseOrders),
      attendance: JSON.stringify(allAttendance),
    };

    // Check for changes in each collection
    if (currentValues.users !== prevValuesRef.current.users) {
      syncCollectionChange('users', allUsers);
      prevValuesRef.current.users = currentValues.users;
    }
    if (currentValues.tickets !== prevValuesRef.current.tickets) {
      syncCollectionChange('tickets', allTickets);
      prevValuesRef.current.tickets = currentValues.tickets;
    }
    if (currentValues.technicians !== prevValuesRef.current.technicians) {
      syncCollectionChange('technicians', allTechnicians);
      prevValuesRef.current.technicians = currentValues.technicians;
    }
    if (currentValues.files !== prevValuesRef.current.files) {
      syncCollectionChange('files', allFiles);
      prevValuesRef.current.files = currentValues.files;
    }
    if (currentValues.symptoms !== prevValuesRef.current.symptoms) {
      syncCollectionChange('symptoms', allSymptoms);
      prevValuesRef.current.symptoms = currentValues.symptoms;
    }
    if (currentValues.templates !== prevValuesRef.current.templates) {
      syncCollectionChange('templates', allTemplates);
      prevValuesRef.current.templates = currentValues.templates;
    }
    if (currentValues.departments !== prevValuesRef.current.departments) {
      syncCollectionChange('departments', allDepartments);
      prevValuesRef.current.departments = currentValues.departments;
    }
    if (currentValues.inventory !== prevValuesRef.current.inventory) {
      syncCollectionChange('inventory', allInventory);
      prevValuesRef.current.inventory = currentValues.inventory;
    }
    if (currentValues.vendors !== prevValuesRef.current.vendors) {
      syncCollectionChange('vendors', allVendors);
      prevValuesRef.current.vendors = currentValues.vendors;
    }
    if (currentValues.challans !== prevValuesRef.current.challans) {
      syncCollectionChange('challans', allChallans);
      prevValuesRef.current.challans = currentValues.challans;
    }
    if (currentValues.invoices !== prevValuesRef.current.invoices) {
      syncCollectionChange('outward-invoices', allInvoices);
      prevValuesRef.current.invoices = currentValues.invoices;
    }
    if (currentValues.purchaseOrders !== prevValuesRef.current.purchaseOrders) {
      syncCollectionChange('purchase-orders', allPurchaseOrders);
      prevValuesRef.current.purchaseOrders = currentValues.purchaseOrders;
    }

    if (currentValues.attendance !== prevValuesRef.current.attendance) {
      syncCollectionChange('attendance', allAttendance);
      prevValuesRef.current.attendance = currentValues.attendance;
    }

    // Update the previous values reference
    prevValuesRef.current = currentValues;
  }, [allUsers, allTickets, allTechnicians, allFiles, allSymptoms,
    allTemplates, allDepartments, allInventory, allVendors,
    allChallans, allInvoices, allPurchaseOrders]);

  // Helper function to sync a collection change
  const syncCollectionChange = useCallback((collection: keyof SyncCollectionMap, data: any) => {
    if (!isConnected || !socketRef.current) {
      return;
    }

    const syncMessage = {
      type: 'SYNC_DATA',
      collection,
      data,
      userId: userIdRef.current,
      timestamp: Date.now()
    };

    try {
      socketRef.current.emit('sync_data', syncMessage);
      console.log(`Synced ${collection} change to other clients`);
    } catch (error) {
      console.error(`Error syncing ${collection} change:`, error);
    }
  }, [isConnected]);

  // Periodically send heartbeat to maintain connection
  useEffect(() => {
    if (!isConnected) return;

    const heartbeatInterval = setInterval(() => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('heartbeat', {
          type: 'HEARTBEAT',
          timestamp: Date.now()
        });
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [isConnected]);

  // Function to manually trigger a sync for a specific collection
  const triggerManualSync = useCallback((collection: keyof SyncCollectionMap) => {
    let data: any;

    switch (collection) {
      case 'users':
        data = allUsers;
        break;
      case 'tickets':
        data = allTickets;
        break;
      case 'technicians':
        data = allTechnicians;
        break;
      case 'files':
        data = allFiles;
        break;
      case 'symptoms':
        data = allSymptoms;
        break;
      case 'templates':
        data = allTemplates;
        break;
      case 'departments':
        data = allDepartments;
        break;
      case 'inventory':
        data = allInventory;
        break;
      case 'vendors':
        data = allVendors;
        break;
      case 'challans':
        data = allChallans;
        break;
      case 'outward-invoices':
        data = allInvoices;
        break;
      case 'purchase-orders':
        data = allPurchaseOrders;
        break;
      case 'attendance':
        data = allAttendance;
        break;
    }

    syncCollectionChange(collection, data);
  }, [allUsers, allTickets, allTechnicians, allFiles, allSymptoms,
    allTemplates, allDepartments, allInventory, allVendors,
    allChallans, allInvoices, allPurchaseOrders, syncCollectionChange]);

  // Function to get sync stats
  const getSyncStats = useCallback(() => {
    try {
      // For now, return a static status
      // In a real implementation, this would query the server
      return { clientCount: socketRef.current ? 1 : 0, collections: [] };
    } catch (e) {
      console.warn('Could not get sync stats:', e);
    }
    return { clientCount: 0, collections: [] };
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    triggerManualSync,
    getSyncStats
  };
};

export default useRealtimeSync;