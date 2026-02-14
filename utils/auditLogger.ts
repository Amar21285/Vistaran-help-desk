import { User, AuditLogEntry } from '../types';

const MAX_LOG_ENTRIES = 200;

// This function is the single source of truth for logging user actions.
export const logUserAction = (user: User | null, action: string) => {
    if (!user) {
        console.warn("Attempted to log action without a user.", action);
        return;
    }

    try {
        const logsStr = localStorage.getItem('vistaran-helpdesk-auditlog');
        const logs: AuditLogEntry[] = logsStr ? JSON.parse(logsStr) : [];
        
        const newLog: AuditLogEntry = {
            id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId: user.id,
            userName: user.name,
            action,
            timestamp: new Date().toISOString(),
            ip: '127.0.0.1', // Mock IP as we can't reliably get this on the client.
        };

        // Add new log to the beginning and trim the array to the max size.
        const updatedLogs = [newLog, ...logs].slice(0, MAX_LOG_ENTRIES);

        localStorage.setItem('vistaran-helpdesk-auditlog', JSON.stringify(updatedLogs));
    } catch (error) {
        console.error("Failed to write to audit log:", error);
    }
};