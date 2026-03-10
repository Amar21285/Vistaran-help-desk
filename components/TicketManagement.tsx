import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, TicketStatus, Priority, User, Technician, Symptom, Role, TicketHistory } from '../types';
import { useAuth } from '../hooks/useAuth';
import TicketList from './TicketList';
import TicketModal from './TicketModal';
import { getSlaDueDate } from '../utils/sla';

interface TicketManagementProps {
    tickets: Ticket[];
    setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
    users: User[];
    technicians: Technician[];
    symptoms: Symptom[];
    globalFilter: string;
    setGlobalFilter: (filter: string) => void;
    setInfoModalContent: (content: { title: string; message: React.ReactNode } | null) => void;
    assignedToMeTechId?: string | null;
    departments: string[];
    onEditTicketExternal?: (ticket: Ticket | null) => void;
}

const TicketManagement: React.FC<TicketManagementProps> = ({ tickets, setTickets, users, technicians, symptoms, globalFilter, setGlobalFilter, setInfoModalContent, assignedToMeTechId, departments, onEditTicketExternal }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === Role.ADMIN;
    const isAssignedToMeView = assignedToMeTechId !== undefined;
    
    // --- Filter State ---
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string | 'all'>('all');
    const [techFilter, setTechFilter] = useState<string | 'all' | 'unassigned'>(
        isAssignedToMeView ? (assignedToMeTechId || 'no_match') : 'all'
    );
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    
    // --- UI State ---
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
    const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
    const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);

    // --- Real-time Sync Effect ---
    useEffect(() => {
        if (editingTicket) {
            const updatedTicket = tickets.find(t => t.id === editingTicket.id);
            
            if (!updatedTicket) {
                setEditingTicket(null);
                onEditTicketExternal?.(null);
                setInfoModalContent({
                    title: "Ticket Unavailable",
                    message: "The ticket you were viewing has been deleted."
                });
            } else if (JSON.stringify(updatedTicket) !== JSON.stringify(editingTicket)) {
                setEditingTicket(updatedTicket);
            }
        }
    }, [tickets, editingTicket, setInfoModalContent, onEditTicketExternal]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (statusFilter !== 'all') count++;
        if (priorityFilter !== 'all') count++;
        if (departmentFilter !== 'all') count++;
        if (techFilter !== 'all' && !isAssignedToMeView) count++;
        if (startDateFilter) count++;
        if (endDateFilter) count++;
        return count;
    }, [statusFilter, priorityFilter, departmentFilter, techFilter, startDateFilter, endDateFilter, isAssignedToMeView]);

    const filteredTickets = useMemo(() => {
        const userTickets = isAssignedToMeView || isAdmin ? tickets : tickets.filter(t => t.userId === user?.id);

        const filtered = userTickets.filter(ticket => {
            const lowercasedFilter = globalFilter.toLowerCase();
            const matchesGlobal = !globalFilter || 
                ticket.id.toLowerCase().includes(lowercasedFilter) ||
                ticket.description.toLowerCase().includes(lowercasedFilter) ||
                (users.find(u => u.id === ticket.userId)?.name.toLowerCase().includes(lowercasedFilter) ?? false);

            const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
            const matchesDepartment = departmentFilter === 'all' || ticket.department === departmentFilter;
            const matchesTech = techFilter === 'all' 
                || (techFilter === 'unassigned' && ticket.assignedTechId === null)
                || ticket.assignedTechId === techFilter;
            
            const ticketDateStr = ticket.dateCreated.substring(0, 10);
            const matchesDate = 
                (!startDateFilter || ticketDateStr >= startDateFilter) &&
                (!endDateFilter || ticketDateStr <= endDateFilter);

            return matchesGlobal && matchesStatus && matchesPriority && matchesDepartment && matchesTech && matchesDate;
        });

        const priorityOrder: Record<Priority, number> = {
            [Priority.URGENT]: 4,
            [Priority.HIGH]: 3,
            [Priority.MEDIUM]: 2,
            [Priority.LOW]: 1,
        };
        const statusOrder: Record<TicketStatus, number> = {
            [TicketStatus.OPEN]: 3,
            [TicketStatus.IN_PROGRESS]: 2,
            [TicketStatus.RESOLVED]: 1,
        };
        
        const sorted = [...filtered];

        sorted.sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
                case 'priority':
                    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                case 'sla':
                    return new Date(getSlaDueDate(a)).getTime() - new Date(getSlaDueDate(b)).getTime();
                case 'status':
                    return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
                case 'newest':
                default:
                    return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
            }
        });

        return sorted;
        
    }, [tickets, user, isAdmin, globalFilter, statusFilter, priorityFilter, departmentFilter, techFilter, startDateFilter, endDateFilter, users, isAssignedToMeView, sortBy]);
    
    const handleTicketSave = (updatedTicket: Ticket, shouldClose: boolean = true) => {
        setTickets(prevTickets => prevTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        if (shouldClose) {
            setEditingTicket(null);
            onEditTicketExternal?.(null);
        } else {
            setEditingTicket(updatedTicket);
            onEditTicketExternal?.(updatedTicket);
        }
    };
    
    const handleResetFilters = () => {
        setStatusFilter('all');
        setPriorityFilter('all');
        setDepartmentFilter('all');
        setTechFilter(isAssignedToMeView ? (assignedToMeTechId || 'no_match') : 'all');
        setStartDateFilter('');
        setEndDateFilter('');
    };

    const handleTicketSelect = (ticketId: string) => {
        setSelectedTicketIds(prev =>
            prev.includes(ticketId)
                ? prev.filter(id => id !== ticketId)
                : [...prev, ticketId]
        );
    };

    const handleBulkUpdate = (updates: Partial<Omit<Ticket, 'id' | 'userId' | 'email'>>) => {
        if (selectedTicketIds.length === 0 || !user) return;

        let changeDescription = '';
        if(updates.status) changeDescription = `Status updated to ${updates.status}`;
        if(updates.priority) changeDescription = `Priority updated to ${updates.priority}`;
        if(updates.assignedTechId || updates.assignedTechId === null) {
            const techName = technicians.find(t => t.id === updates.assignedTechId)?.name || 'Unassigned';
            changeDescription = `Assigned technician changed to ${techName}`;
        }
        
        setTickets(prevTickets =>
            prevTickets.map(ticket => {
                if (selectedTicketIds.includes(ticket.id)) {
                    const newHistoryEntry: TicketHistory = {
                        id: `HIST${Date.now()}_${ticket.id.slice(-4)}`,
                        ticketId: ticket.id,
                        userId: user.id,
                        change: `${changeDescription} (via bulk action).`,
                        timestamp: new Date().toISOString()
                    };
                    
                    const dateResolvedUpdate = (updates.status === TicketStatus.RESOLVED && ticket.status !== TicketStatus.RESOLVED)
                        ? { dateResolved: new Date().toISOString() }
                        : {};

                    return {
                        ...ticket,
                        ...updates,
                        ...dateResolvedUpdate,
                        history: [...(ticket.history || []), newHistoryEntry]
                    };
                }
                return ticket;
            })
        );

        setSelectedTicketIds([]);
    };
    
    const confirmBulkDelete = () => {
        setTickets(prevTickets => prevTickets.filter(ticket => !selectedTicketIds.includes(ticket.id)));
        setSelectedTicketIds([]);
        setIsConfirmingBulkDelete(false);
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {isAssignedToMeView ? 'My Assigned Tickets' : (isAdmin ? 'Ticket Management' : 'My Tickets')}
                </h2>
                
                <div className="flex items-center gap-2 no-print w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <i className="fas fa-sort-amount-down"></i>
                        </div>
                        <select 
                            value={sortBy} 
                            onChange={e => setSortBy(e.target.value)} 
                            className="w-full sm:w-48 pl-10 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition shadow-sm appearance-none cursor-pointer font-semibold text-slate-700 dark:text-slate-200"
                            aria-label="Sort tickets"
                        >
                            <option value="newest">Newest Created</option>
                            <option value="oldest">Oldest Created</option>
                            <option value="priority">Highest Priority</option>
                            <option value="sla">Soonest SLA Due</option>
                            <option value="status">Status (Open First)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                            <i className="fas fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setIsFilterPanelOpen(prev => !prev)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition shadow-sm ${
                            isFilterPanelOpen || activeFilterCount > 0
                                ? 'bg-primary border-primary text-white'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                        aria-expanded={isFilterPanelOpen}
                    >
                        <i className="fas fa-filter"></i>
                        <span className="hidden sm:inline font-semibold">Filter</span>
                        {activeFilterCount > 0 && 
                            <span className="bg-white text-primary text-xs font-bold px-2 py-0.5 rounded-full">{activeFilterCount}</span>
                        }
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md no-print">
                <div 
                    id="filter-panel"
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterPanelOpen ? 'max-h-[500px] p-6 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex flex-col">
                            <label htmlFor="status-filter" className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Status</label>
                            <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value as TicketStatus | 'all')} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm">
                                <option value="all">All Statuses</option>
                                {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="priority-filter" className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Priority</label>
                            <select id="priority-filter" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as Priority | 'all')} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm">
                                <option value="all">All Priorities</option>
                                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="department-filter" className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Department</label>
                             <select id="department-filter" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm">
                                <option value="all">All Departments</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="tech-filter" className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Assigned Tech</label>
                             <select id="tech-filter" value={techFilter} onChange={e => setTechFilter(e.target.value)} disabled={isAssignedToMeView} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700/50">
                                <option value="all">All Technicians</option>
                                <option value="unassigned">Unassigned</option>
                                {[...technicians].sort((a, b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                         <div className="flex flex-col">
                            <label htmlFor="start-date-filter" className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Created After</label>
                            <input type="date" id="start-date-filter" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm" />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="end-date-filter" className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Created Before</label>
                            <input type="date" id="end-date-filter" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm" />
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3 border-t dark:border-slate-700 pt-4">
                        <button onClick={handleResetFilters} className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">
                            Clear Filters
                        </button>
                        <button onClick={() => setIsFilterPanelOpen(false)} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition text-sm">
                            Close Panel
                        </button>
                    </div>
                </div>
            </div>

            {isAssignedToMeView && !assignedToMeTechId ? (
                <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-lg shadow">
                    <i className="fas fa-user-slash text-4xl text-slate-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-200">Not a Technician</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Your account is not linked to a technician profile, so no tickets can be assigned to you.</p>
                </div>
            ) : (
                <TicketList 
                    tickets={filteredTickets} 
                    onEditTicket={(t) => { setEditingTicket(t); onEditTicketExternal?.(t); }} 
                    technicians={technicians} 
                    symptoms={symptoms} 
                    selectedTicketIds={selectedTicketIds}
                    onTicketSelect={handleTicketSelect}
                />
            )}
            
            {editingTicket && (
                <TicketModal
                    ticket={editingTicket}
                    onClose={() => { setEditingTicket(null); onEditTicketExternal?.(null); }}
                    onSave={handleTicketSave}
                    technicians={technicians}
                    users={users}
                />
            )}
            
            {isAdmin && selectedTicketIds.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 shadow-2xl p-4 border-t dark:border-slate-700 z-40 flex items-center justify-center gap-4 no-print flex-wrap animate-in slide-in-from-bottom duration-300">
                    <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">{selectedTicketIds.length} ticket(s) selected</span>
                    <select
                        className="p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 shadow-sm"
                        onChange={(e) => {
                            if (e.target.value) handleBulkUpdate({ status: e.target.value as TicketStatus });
                            e.target.value = '';
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>-- Change Status --</option>
                        {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                        className="p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 shadow-sm"
                         onChange={(e) => {
                            if (e.target.value) handleBulkUpdate({ priority: e.target.value as Priority });
                             e.target.value = '';
                        }}
                         defaultValue=""
                    >
                        <option value="" disabled>-- Change Priority --</option>
                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                     <select
                        className="p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 shadow-sm"
                         onChange={(e) => {
                            if (e.target.value) handleBulkUpdate({ assignedTechId: e.target.value === 'unassigned' ? null : e.target.value });
                             e.target.value = '';
                        }}
                         defaultValue=""
                    >
                        <option value="" disabled>-- Assign Tech --</option>
                        <option value="unassigned">Unassigned</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button onClick={() => setIsConfirmingBulkDelete(true)} className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg transition text-sm flex items-center gap-2 shadow-md">
                        <i className="fas fa-trash"></i> Delete
                    </button>
                    <button onClick={() => setSelectedTicketIds([])} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold text-sm p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                        <i className="fas fa-times-circle mr-1"></i> Clear Selection
                    </button>
                </div>
            )}

            {isConfirmingBulkDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center modal-content">
                        <div className="text-red-500 mb-4"><i className="fas fa-exclamation-triangle fa-3x"></i></div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Confirm Bulk Deletion</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4">Are you sure you want to permanently delete the selected <strong className="font-semibold">{selectedTicketIds.length} tickets</strong>?<br /><strong className="text-red-600">This action is irreversible.</strong></p>
                        <div className="flex justify-center gap-4 mt-6">
                            <button onClick={() => setIsConfirmingBulkDelete(false)} className="bg-slate-200 text-slate-700 font-semibold px-6 py-2 rounded-lg hover:bg-slate-300 transition">Cancel</button>
                            <button onClick={confirmBulkDelete} className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-700 transition">Delete Tickets</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketManagement;