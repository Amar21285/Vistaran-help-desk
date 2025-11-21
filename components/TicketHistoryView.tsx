import React, { useMemo } from 'react';
import type { TicketHistory, User } from '../types';

interface TicketHistoryViewProps {
    history?: TicketHistory[];
    users: User[];
}

// Helper for styling history events
const eventStyles = {
    status: { icon: 'fas fa-flag', color: 'bg-blue-500', title: 'Status Change' },
    priority: { icon: 'fas fa-exclamation-triangle', color: 'bg-amber-500', title: 'Priority Change' },
    assignment: { icon: 'fas fa-user-tag', color: 'bg-indigo-500', title: 'Assignment' },
    notes: { icon: 'fas fa-sticky-note', color: 'bg-slate-500', title: 'Notes Updated' },
    bulk: { icon: 'fas fa-layer-group', color: 'bg-purple-500', title: 'Bulk Action' },
    default: { icon: 'fas fa-info-circle', color: 'bg-slate-500', title: 'General Update' },
};

const getHistoryEventDetails = (change: string) => {
    const lowerChange = change.toLowerCase();
    if (lowerChange.includes('bulk action')) return eventStyles.bulk;
    if (lowerChange.includes('status changed') || lowerChange.includes('status updated')) return eventStyles.status;
    if (lowerChange.includes('priority changed')) return eventStyles.priority;
    if (lowerChange.includes('technician changed') || lowerChange.includes('assigned')) return eventStyles.assignment;
    if (lowerChange.includes('notes')) return eventStyles.notes;
    return eventStyles.default;
};


const TicketHistoryView: React.FC<TicketHistoryViewProps> = ({ history = [], users }) => {
    // Sort from newest to oldest for a more conventional log view
    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [history]);

    if (sortedHistory.length === 0) {
        return (
            <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Ticket History</h3>
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No history found for this ticket.</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Ticket History Timeline</h3>
            <div className="flow-root">
                <ul role="list" className="-mb-8">
                    {sortedHistory.map((item, itemIdx) => {
                        const eventUser = users.find(u => u.id === item.userId);
                        const eventDetails = getHistoryEventDetails(item.change);
                        
                        return (
                            <li key={item.id}>
                                <div className="relative pb-8">
                                    {/* Vertical line connector */}
                                    {itemIdx !== sortedHistory.length - 1 ? (
                                        <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex items-start space-x-4">
                                        {/* Icon Marker */}
                                        <div className="relative" title={eventDetails.title}>
                                            <span className={`h-10 w-10 rounded-full ${eventDetails.color} flex items-center justify-center ring-8 ring-white dark:ring-slate-800`}>
                                                <i className={`${eventDetails.icon} text-white text-base`}></i>
                                            </span>
                                        </div>
                                        {/* Event details */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <img 
                                                        className="h-6 w-6 rounded-full object-cover" 
                                                        src={eventUser?.photo || `https://ui-avatars.com/api/?name=${eventUser?.name || 'S'}`} 
                                                        alt={eventUser?.name || 'User'} 
                                                    />
                                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{eventUser?.name || 'System'}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(item.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md border dark:border-slate-600">
                                                <p className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{eventDetails.title}</p>
                                                <p>{item.change}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    );
};

export default TicketHistoryView;