// Test file to verify imports are working correctly
import type { Ticket, User, Technician, Symptom, TicketTemplate, ManagedFile } from './types';
import { databaseService } from './utils/database';
import { useDatabase } from './hooks/useDatabase';

console.log('Import test completed successfully');
console.log('Database service:', typeof databaseService);
console.log('Use database hook:', typeof useDatabase);