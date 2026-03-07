import React, { useMemo } from 'react';
import { Ticket, TicketStatus, Role, Priority } from '../types';
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

    const isImage = ticket.photoUrl?.startsWith('data:image/');
    const isPDF = ticket.photoUrl?.startsWith('data:application/pdf');
    
    return (
        <div className={`relative bg-white dark:bg-slate-800 rounded-3xl p-4 md:p-6 flex flex-col justify-between transition-all duration-300 border border-slate-100 dark:border-slate-700 ${isSelected ? 'ring-4 ring-primary shadow-2xl' : 'shadow-md hover:shadow-xl'}`}>
            {slaBreached && isOpen && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-tr-3xl rounded-bl-xl z-10 flex items-center gap-1 uppercase tracking-widest shadow-lg" title="SLA Breached">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>SLA BREACHED</span>
                </div>
            )}
            {isAdmin && (
                <div className="absolute top-4 left-4 z-10">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(ticket.id)}
                        className="h-6 w-6 rounded-lg text-primary focus:ring-primary border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm transition-transform active:scale-90"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ticket ${ticket.id}`}
                    />
                </div>
            )}
            <div>
                <div className="flex justify-between items-start mb-6">
                    <div className={isAdmin ? 'ml-10' : ''}>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 break-words uppercase tracking-tighter leading-tight">{symptomName || 'General Issue'}</h3>
                        <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1"># {ticket.id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                        {ticket.chatHistory && ticket.chatHistory.length > 0 && (
                             <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${hasUnreadMessage ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`} title={hasUnreadMessage ? "New message" : "Chat history available"}>
                                <i className="fas fa-comments"></i>
                                {hasUnreadMessage ? "New Msg" : "Active"}
                            </div>
                        )}
                    </div>
                </div>
                
                {ticket.photoUrl && (
                    <div className="mb-4 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 shadow-inner group relative">
                        {isImage ? (
                            <img src={ticket.photoUrl} alt="Ticket related" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-44 flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <i className={`fas ${isPDF ? 'fa-file-pdf text-rose-500' : 'fa-file-alt text-blue-500'} text-5xl`}></i>
                                <p className="text-[10px] font-black uppercase tracking-widest">Document Attached</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <a 
                                href={ticket.photoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-110 transition-transform"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <i className="fas fa-external-link-alt"></i> View File
                             </a>
                        </div>
                    </div>
                )}

                <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 h-12 overflow-hidden text-ellipsis line-clamp-2 leading-relaxed">
                    {ticket.description}
                </p>

                <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 space-y-0 border-t dark:border-slate-700 pt-6">
                    <div className="space-y-1">
                        <p className="uppercase tracking-widest text-slate-400">Requestor</p>
                        <p className="text-slate-700 dark:text-slate-200 truncate">{ticket.email}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="uppercase tracking-widest text-slate-400">SLA Due</p>
                        <p className={`font-black ${slaBreached && isOpen ? 'text-red-600 animate-pulse' : 'text-slate-700 dark:text-slate-200'}`}>
                            {new Date(slaDueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                    </div>
                    <div className="space-y-1 col-span-2 pt-2 flex justify-between items-end border-t border-slate-50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                                <i className="fas fa-user-gear"></i>
                             </div>
                             <span className="text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                {technicianName || 'Unassigned'}
                             </span>
                        </div>
                        <span className="text-slate-300 font-mono">[{new Date(ticket.dateCreated).toLocaleDateString()}]</span>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                {user?.role === Role.ADMIN && (
                     <button
                        onClick={() => onEdit(ticket)}
                        className="w-full flex items-center justify-center space-x-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black py-4 rounded-2xl shadow-xl transition-all duration-300 hover:opacity-90 active:scale-95 uppercase tracking-widest text-[10px]"
                    >
                        <i className="fas fa-screwdriver-wrench"></i>
                        <span>Manage Incident</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default TicketCard;