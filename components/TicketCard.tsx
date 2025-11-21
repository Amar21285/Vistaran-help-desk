import React, { useMemo } from 'react';
import type { Ticket, Technician, Symptom } from '../types';
import { Priority, TicketStatus, Role } from '../types';
import { useAuth } from '../hooks/useAuth';
import EditIcon from './icons/EditIcon';
import { getSlaDueDate, isSlaBreached } from '../utils/sla';

interface TicketCardProps {
    ticket: Ticket;
    onEdit: (ticket: Ticket) => void;
    technicianName?: string;
    symptomName?: string;
    isSelected: boolean;
    onSelect: (ticketId: string) => void;
}

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
    const statusStyles: Record<TicketStatus, string> = {
        [TicketStatus.OPEN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        [TicketStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        [TicketStatus.RESOLVED]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[status]}`}>
            {status}
        </span>
    );
};

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    const priorityStyles: Record<Priority, string> = {
        [Priority.URGENT]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        [Priority.HIGH]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        [Priority.MEDIUM]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        [Priority.LOW]: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    };
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${priorityStyles[priority] || 'bg-gray-100 text-gray-800'}`}>
            {priority}
        </span>
    );
};


const TicketCard: React.FC<TicketCardProps> = ({ ticket, onEdit, technicianName, symptomName, isSelected, onSelect }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === Role.ADMIN;
    const slaDueDate = getSlaDueDate(ticket);
    const slaBreached = isSlaBreached(ticket);
    const isOpen = ticket.status === TicketStatus.OPEN || ticket.status === TicketStatus.IN_PROGRESS;

    const hasUnreadMessage = useMemo(() => {
        if (!user || !ticket.chatHistory || ticket.chatHistory.length === 0) {
            return false;
        }
        const lastMessage = ticket.chatHistory[ticket.chatHistory.length - 1];
        // It's unread if the last message was not sent by the current user.
        return lastMessage.senderId !== user.id;
    }, [ticket.chatHistory, user]);
    
    return (
        <div className={`relative bg-white dark:bg-slate-800 rounded-lg p-6 flex flex-col justify-between transition-all duration-300 ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md hover:shadow-xl'}`}>
            {slaBreached && isOpen && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-tr-lg rounded-bl-lg z-10 flex items-center gap-1" title="SLA Breached">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>SLA BREACHED</span>
                </div>
            )}
            {isAdmin && (
                <div className="absolute top-3 left-3 z-10">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(ticket.id)}
                        className="h-5 w-5 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ticket ${ticket.id}`}
                    />
                </div>
            )}
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className={isAdmin ? 'ml-8' : ''}>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 break-words">{symptomName || 'General Issue'}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">#{ticket.id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                        {ticket.chatHistory && ticket.chatHistory.length > 0 && (
                             <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${hasUnreadMessage ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`} title={hasUnreadMessage ? "New message" : "Chat history available"}>
                                <i className="fas fa-comments"></i>
                                {hasUnreadMessage && <span className="font-bold">New</span>}
                            </div>
                        )}
                    </div>
                </div>
                {ticket.photoUrl && (
                    <img src={ticket.photoUrl} alt="Ticket related" className="rounded-lg mb-4 w-full h-40 object-cover" />
                )}
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 h-16 overflow-hidden text-ellipsis">
                    {ticket.description}
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 border-t dark:border-slate-700 pt-4">
                    <p><strong>User:</strong> {ticket.email}</p>
                    <p><strong>Created:</strong> {new Date(ticket.dateCreated).toLocaleString()}</p>
                    <p className={`font-semibold ${slaBreached && isOpen ? 'text-red-600' : ''}`}>
                        <strong>Due:</strong> {new Date(slaDueDate).toLocaleString()}
                    </p>
                    <p><strong>Assigned Tech:</strong> {technicianName || 'Unassigned'}</p>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                {user?.role === Role.ADMIN && (
                     <button
                        onClick={() => onEdit(ticket)}
                        className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg transition duration-300"
                    >
                        <EditIcon />
                        <span>Manage Ticket</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default TicketCard;