import React, { useMemo } from 'react';
import { Ticket, TicketStatus, User, Role, InventoryItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import StatCard from './StatCard';
import TicketStatusChart from './charts/TicketStatusChart';
import TicketsTrendChart from './charts/TicketsTrendChart';
import DepartmentChart from './charts/DepartmentChart';
import useLocalStorage from '../hooks/useLocalStorage';
import { INVENTORY } from '../constants';

interface DashboardProps {
    tickets: Ticket[];
    users: User[];
    globalFilter: string;
}

const TicketRow: React.FC<{ticket: Ticket}> = ({ ticket }) => (
     <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition">
        <div className="overflow-hidden">
            <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">#{ticket.id}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{ticket.description}</p>
        </div>
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ml-2 ${
            ticket.status === TicketStatus.OPEN ? 'bg-blue-100 text-blue-700' :
            ticket.status === TicketStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
        }`}>
            {ticket.status}
        </span>
    </div>
);

const ResolvedTicketRow: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition">
        <div className="overflow-hidden">
            <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">#{ticket.id}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{ticket.description}</p>
        </div>
        <div className="text-right shrink-0 ml-2">
            <p className="text-[8px] font-black text-green-700 dark:text-green-400 uppercase">Resolved</p>
            <p className="text-[8px] text-slate-400 uppercase font-bold">
                {ticket.dateResolved ? new Date(ticket.dateResolved).toLocaleDateString() : 'N/A'}
            </p>
        </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ tickets, users, globalFilter }) => {
    const { user: currentUser } = useAuth();
    const [inventory] = useLocalStorage<InventoryItem[]>('vistaran-helpdesk-inventory', INVENTORY);

    const filteredTickets = useMemo(() => {
        if (!currentUser) return [];

        let userTickets = currentUser.role === Role.ADMIN
            ? tickets
            : tickets.filter(ticket => ticket.userId === currentUser.id);

        if (!globalFilter) {
            return userTickets;
        }

        const lowercasedFilter = globalFilter.toLowerCase();
        return userTickets.filter(ticket => {
            const ticketUser = users.find(u => u.id === ticket.userId);
            return ticket.id.toLowerCase().includes(lowercasedFilter) ||
                   ticket.description.toLowerCase().includes(lowercasedFilter) ||
                   ticket.department.toLowerCase().includes(lowercasedFilter) ||
                   (ticketUser && ticketUser.name.toLowerCase().includes(lowercasedFilter));
        });
    }, [tickets, users, currentUser, globalFilter]);
    
    const recentTickets = useMemo(() => {
      return [...filteredTickets].sort((a,b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
    }, [filteredTickets]);

    const recentlyResolvedTickets = useMemo(() => {
        return tickets
            .filter(ticket => ticket.status === TicketStatus.RESOLVED && ticket.dateResolved)
            .sort((a, b) => new Date(b.dateResolved!).getTime() - new Date(a.dateResolved!).getTime())
            .slice(0, 5);
    }, [tickets]);

    const lowStockItems = useMemo(() => {
        return inventory.filter(item => item.quantity <= item.minStock);
    }, [inventory]);


    const stats = useMemo(() => {
        const pending = filteredTickets.filter(t => t.status === TicketStatus.OPEN || t.status === TicketStatus.IN_PROGRESS).length;
        const resolved = filteredTickets.filter(t => t.status === TicketStatus.RESOLVED).length;
        return {
            totalTickets: filteredTickets.length,
            pendingTickets: pending,
            resolvedTickets: resolved,
            totalUsers: users.length,
        };
    }, [filteredTickets, users]);

    const statusChartData = useMemo(() => {
        const counts: Record<string, number> = {
            [TicketStatus.OPEN]: 0,
            'In Progress': 0,
            [TicketStatus.RESOLVED]: 0,
        };
        
        filteredTickets.forEach(ticket => {
            if (counts[ticket.status] !== undefined) {
                counts[ticket.status]++;
            }
        });
        
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }));
    }, [filteredTickets]);

    const departmentChartData = useMemo(() => {
        const departments = Array.from(new Set(filteredTickets.map(t => t.department)));
        return departments.map(dept => ({
            name: dept,
            tickets: filteredTickets.filter(t => t.department === dept).length
        })).sort((a, b) => b.tickets - a.tickets).slice(0, 5);
    }, [filteredTickets]);

    const trendDates = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return {
            start: d.toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        };
    }, []);

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="px-1">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter leading-none">Command Center</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2">Live Fleet Intelligence</p>
                </div>
                {currentUser?.role === Role.ADMIN && lowStockItems.length > 0 && (
                     <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl border border-red-200 dark:border-red-800 flex items-center gap-3 animate-pulse">
                        <i className="fas fa-exclamation-triangle text-red-500"></i>
                        <p className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest leading-none">{lowStockItems.length} items low stock</p>
                    </div>
                )}
            </header>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Total" value={stats.totalTickets} iconClass="fas fa-ticket-alt" />
                <StatCard title="Pending" value={stats.pendingTickets} iconClass="fas fa-clock" />
                <StatCard title="Done" value={stats.resolvedTickets} iconClass="fas fa-check-circle" />
                <div className="hidden sm:block">
                   <StatCard title="Active Fleet" value={users.filter(u => u.status === 'Active').length} iconClass="fas fa-users" />
                </div>
                <div className="sm:hidden">
                    <StatCard title="Fleet" value={users.filter(u => u.status === 'Active').length} iconClass="fas fa-users" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Traffic Analysis (7D)</h3>
                    <div className="h-[200px] md:h-[250px]">
                        <TicketsTrendChart tickets={filteredTickets} startDate={trendDates.start} endDate={trendDates.end} />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Operational Status</h3>
                    <div className="h-[200px] md:h-[250px]">
                        <TicketStatusChart data={statusChartData} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Recent Stream
                        </h3>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    </div>
                    <div className="space-y-3">
                        {recentTickets.length > 0 ? (
                            recentTickets.slice(0, 4).map(ticket => <TicketRow key={ticket.id} ticket={ticket} />)
                        ) : (
                            <p className="text-center py-8 text-slate-400 font-bold uppercase text-[10px]">No telemetry.</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Segment Distribution</h3>
                    <div className="h-[200px] md:h-[250px]">
                        <DepartmentChart data={departmentChartData} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;