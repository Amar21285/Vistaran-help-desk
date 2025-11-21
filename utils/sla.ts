import type { Ticket } from '../types';
import { Priority } from '../types';

// Service Level Agreement (SLA) response times in hours
const SLA_TIMES: Record<Priority, number> = {
    [Priority.URGENT]: 4,
    [Priority.HIGH]: 8,
    [Priority.MEDIUM]: 24,
    [Priority.LOW]: 72,
};

/**
 * Calculates the SLA due date for a given ticket.
 * @param ticket - The ticket object.
 * @returns The ISO string of the due date.
 */
export const getSlaDueDate = (ticket: Ticket): string => {
    const createdDate = new Date(ticket.dateCreated);
    const slaHours = SLA_TIMES[ticket.priority] || SLA_TIMES[Priority.LOW];
    const dueDate = new Date(createdDate.getTime() + slaHours * 60 * 60 * 1000);
    return dueDate.toISOString();
};

/**
 * Checks if a ticket has breached its SLA.
 * @param ticket - The ticket object.
 * @returns True if the SLA has been breached, false otherwise.
 */
export const isSlaBreached = (ticket: Ticket): boolean => {
    if (ticket.dateResolved) {
        // If resolved, check if it was resolved after the due date.
        const dueDate = new Date(getSlaDueDate(ticket));
        const resolvedDate = new Date(ticket.dateResolved);
        return resolvedDate > dueDate;
    } else {
        // If not resolved, check if the current time is past the due date.
        const dueDate = new Date(getSlaDueDate(ticket));
        return new Date() > dueDate;
    }
};