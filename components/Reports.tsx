import React, { useState, useMemo } from 'react';
import TicketStatusChart from './charts/TicketStatusChart';
import DepartmentChart from './charts/DepartmentChart';
import TicketsTrendChart from './charts/TicketsTrendChart';
import type { Ticket, User } from '../types';
import { TicketStatus, Priority } from '../types';

interface ReportsProps {
    tickets: Ticket[];
    users: User[];
    departments: string[];
}

const ReportCard: React.FC<{ title: string; description: string; buttonText: string; onClick: () => void; iconClass: string; }> = ({ title, description, buttonText, onClick, iconClass }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex flex-col">
        <div className="flex-grow">
            <div className="text-2xl text-primary mb-2"><i className={iconClass}></i></div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
        <button onClick={onClick} className="mt-4 bg-primary-light dark:dark:bg-primary-light-dark text-primary-light-text dark:dark:text-primary-light-text-dark font-semibold px-4 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition w-full text-left">
            {buttonText}
        </button>
    </div>
);

const MetricCard: React.FC<{ title: string; value: string; iconClass: string; }> = ({ title, value, iconClass }) => (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center space-x-4">
        <div className="text-3xl text-primary bg-primary-light dark:bg-primary-light-dark dark:dark:text-primary-dark p-3 rounded-full">
            <i className={iconClass}></i>
        </div>
        <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">{title}</p>
        </div>
    </div>
);

const ChartCard: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md ${className}`}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            <button 
                onClick={() => alert(`Updating ${title}...`)} 
                className="bg-primary-light dark:dark:bg-primary-light-dark text-primary-light-text dark:dark:text-primary-light-text-dark font-semibold px-4 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition flex items-center gap-2 text-sm no-print"
            >
                <i className="fas fa-sync-alt"></i>
                Update now
            </button>
        </div>
        {children}
    </div>
);

const today = new Date();
const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

const Reports: React.FC<ReportsProps> = ({ tickets: allTickets, users, departments }) => {
    // --- State for Filters ---
    const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [departmentFilter, setDepartmentFilter] = useState<string | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');

    // --- Memoized Calculations ---
    const filteredTickets = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return allTickets.filter(ticket => {
            const createdDate = new Date(ticket.dateCreated);
            const isDateInRange = createdDate >= start && createdDate <= end;
            const isDeptMatch = departmentFilter === 'all' || ticket.department === departmentFilter;
            const isStatusMatch = statusFilter === 'all' || ticket.status === statusFilter;
            return isDateInRange && isDeptMatch && isStatusMatch;
        });
    }, [allTickets, startDate, endDate, departmentFilter, statusFilter]);

    const reportStats = useMemo(() => {
        const resolvedInPeriod = filteredTickets.filter(t => t.status === TicketStatus.RESOLVED && t.dateResolved);
        
        let totalResolutionTime = 0;
        resolvedInPeriod.forEach(t => {
            if (t.dateResolved) {
                totalResolutionTime += new Date(t.dateResolved).getTime() - new Date(t.dateCreated).getTime();
            }
        });

        const avgResolutionTimeMs = resolvedInPeriod.length > 0 ? totalResolutionTime / resolvedInPeriod.length : 0;
        
        const formatDuration = (ms: number) => {
            if (ms <= 0) return 'N/A';
            const hours = ms / (1000 * 60 * 60);
            if (hours < 24) return `${hours.toFixed(1)} hours`;
            return `${(hours / 24).toFixed(1)} days`;
        };

        return {
            ticketsInPeriod: filteredTickets.length,
            resolvedCount: resolvedInPeriod.length,
            avgResolutionTime: formatDuration(avgResolutionTimeMs),
        };
    }, [filteredTickets]);

    const statusChartData = useMemo(() => {
        const counts = filteredTickets.reduce((acc: Record<string, number>, ticket) => {
            const status: string = ticket.status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredTickets]);
    
    const departmentChartData = useMemo(() => {
        const counts = filteredTickets.reduce((acc: Record<string, number>, ticket) => {
            const department: string = ticket.department;
            acc[department] = (acc[department] || 0) + 1;
            return acc;
        }, {});
        
        // Convert to an array and sort by ticket count in descending order
        const sortedData = Object.entries(counts)
            .map(([name, value]) => ({ name, tickets: value }))
            // FIX: Replaced subtraction in sort with explicit comparison to resolve potential type errors.
            .sort((a, b) => (a.tickets > b.tickets ? -1 : a.tickets < b.tickets ? 1 : 0));

        return sortedData;
    }, [filteredTickets]);


    // --- Handlers ---
    const handlePrint = () => window.print();
    
    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`${fileName} has started downloading.`);
    };

    const handleExportFiltered = () => {
        const headers = ['ID', 'Description', 'Status', 'Priority', 'Department', 'User Name', 'Date Created', 'Date Resolved', 'Resolution Time (Hours)'];
        const rows = filteredTickets.map(t => {
            const user = users.find(u => u.id === t.userId);
            let resolutionHours = 'N/A';
            if(t.dateResolved) {
                const diff = new Date(t.dateResolved).getTime() - new Date(t.dateCreated).getTime();
                resolutionHours = (diff / (1000 * 60 * 60)).toFixed(2);
            }

            return [
                t.id,
                `"${t.description.replace(/"/g, '""')}"`,
                t.status,
                t.priority,
                t.department,
                `"${user?.name || 'Unknown'}"`,
                new Date(t.dateCreated).toISOString(),
                t.dateResolved ? new Date(t.dateResolved).toISOString() : 'N/A',
                resolutionHours
            ].join(',');
        });
        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadFile(csvContent, `vistaran-report-${startDate}-to-${endDate}.csv`, 'text/csv;charset=utf-8;');
    };

    const handleResetFilters = () => {
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        setDepartmentFilter('all');
        setStatusFilter('all');
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Reports & Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">System reports, data automation, and analytics</p>
                </div>
                <button onClick={handlePrint} className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition flex items-center gap-2 no-print">
                    <i className="fas fa-print"></i> Print Report
                </button>
            </header>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md no-print">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Start Date</label>
                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-slate-600 dark:text-slate-300">End Date</label>
                        <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="department-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Department</label>
                        <select id="department-filter" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm">
                            <option value="all">All Departments</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Status</label>
                        <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm">
                            <option value="all">All Statuses</option>
                            {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                         <button onClick={handleResetFilters} className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold p-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition w-full text-sm">
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="printable-area space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard title="Total Tickets in Period" value={String(reportStats.ticketsInPeriod)} iconClass="fas fa-ticket-alt" />
                    <MetricCard title="Resolved in Period" value={String(reportStats.resolvedCount)} iconClass="fas fa-check-circle" />
                    <MetricCard title="Avg. Resolution Time" value={reportStats.avgResolutionTime} iconClass="fas fa-hourglass-half" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartCard title="New Tickets Trend" className="lg:col-span-2">
                        <TicketsTrendChart tickets={filteredTickets} startDate={startDate} endDate={endDate} />
                    </ChartCard>
                    <ChartCard title="Tickets by Status">
                        <TicketStatusChart data={statusChartData} />
                    </ChartCard>
                </div>

                <ChartCard title="Tickets by Department">
                    <DepartmentChart data={departmentChartData} />
                </ChartCard>
                
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 p-6">Detailed Ticket Log</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Ticket ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Resolved</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredTickets.length > 0 ? filteredTickets.map(ticket => {
                                    const user = users.find(u => u.id === ticket.userId);
                                    return (
                                    <tr key={ticket.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{ticket.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{user?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{ticket.department}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.priority === Priority.HIGH || ticket.priority === Priority.URGENT ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{ticket.priority}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(ticket.dateCreated).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{ticket.dateResolved ? new Date(ticket.dateResolved).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                    )}) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-slate-500">No tickets match the current filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="no-print">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Data Exports</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    <ReportCard 
                        title="Export Filtered View (CSV)" 
                        description="Export the tickets currently displayed in the detailed log above to a CSV file."
                        buttonText="Export Filtered CSV"
                        iconClass="fas fa-file-csv"
                        onClick={handleExportFiltered}
                    />
                    <ReportCard 
                        title="All Users Export (CSV)" 
                        description="Export a full list of all users in the system, regardless of the filters set above."
                        buttonText="Export All Users"
                        iconClass="fas fa-users"
                        onClick={() => downloadFile(users.map(u => `${u.id},"${u.name}",${u.email},${u.role}`).join('\n'), 'all-users.csv', 'text/csv')}
                    />
                </div>
            </div>
        </div>
    );
};

export default Reports;
