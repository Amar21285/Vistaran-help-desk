import React, { useMemo, useState } from 'react';
import { Ticket, TicketStatus, Priority, User } from '../types';
import TicketStatusChart from './charts/TicketStatusChart';
import TicketsTrendChart from './charts/TicketsTrendChart';
import DepartmentChart from './charts/DepartmentChart';
import StatCard from './StatCard';
import { isSlaBreached } from '../utils/sla';

interface AnalyticsProps {
    tickets: Ticket[];
    users: User[];
    departments: string[];
}

const Analytics: React.FC<AnalyticsProps> = ({ tickets, users, departments }) => {
    const [timeframe, setTimeframe] = useState<'7' | '30' | 'all'>('30');

    const filteredData = useMemo(() => {
        if (timeframe === 'all') return tickets;
        const now = new Date();
        const days = parseInt(timeframe);
        const cutoff = new Date(now.setDate(now.getDate() - days));
        return tickets.filter(t => new Date(t.dateCreated) >= cutoff);
    }, [tickets, timeframe]);

    const stats = useMemo(() => {
        const total = filteredData.length;
        const resolved = filteredData.filter(t => t.status === TicketStatus.RESOLVED).length;
        const inProgress = filteredData.filter(t => t.status === TicketStatus.IN_PROGRESS).length;
        const breached = filteredData.filter(t => (t.status !== TicketStatus.RESOLVED) && isSlaBreached(t)).length;
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        return { total, resolved, inProgress, breached, resolutionRate };
    }, [filteredData]);

    const statusChartData = useMemo(() => {
        const counts = {
            [TicketStatus.OPEN]: filteredData.filter(t => t.status === TicketStatus.OPEN).length,
            [TicketStatus.IN_PROGRESS]: filteredData.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
            [TicketStatus.RESOLVED]: filteredData.filter(t => t.status === TicketStatus.RESOLVED).length,
        };
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredData]);

    const departmentChartData = useMemo(() => {
        return departments.map(dept => ({
            name: dept,
            tickets: filteredData.filter(t => t.department === dept).length
        })).sort((a, b) => b.tickets - a.tickets).slice(0, 10);
    }, [filteredData, departments]);

    const priorityChartData = useMemo(() => {
        const priorities = Object.values(Priority);
        return priorities.map(p => ({
            name: p,
            value: filteredData.filter(t => t.priority === p).length
        })).sort((a, b) => b.value - a.value);
    }, [filteredData]);

    const startDate = useMemo(() => {
        if (timeframe === 'all' && tickets.length > 0) {
            return tickets.sort((a,b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime())[0].dateCreated.split('T')[0];
        }
        const d = new Date();
        d.setDate(d.getDate() - (timeframe === '7' ? 7 : 30));
        return d.toISOString().split('T')[0];
    }, [timeframe, tickets]);

    const endDate = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-8 pb-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Analytics Intelligence</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">Advanced metrics and system health indicators.</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex">
                    {(['7', '30', 'all'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${timeframe === t ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            {t === 'all' ? 'All Time' : `Last ${t} Days`}
                        </button>
                    ))}
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Tickets" value={stats.total} iconClass="fas fa-ticket-alt" />
                <StatCard title="Resolution Rate" value={`${stats.resolutionRate}%`} iconClass="fas fa-chart-pie" />
                <StatCard title="Active Workload" value={stats.inProgress} iconClass="fas fa-tasks" />
                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md flex items-center space-x-4 border-l-4 border-red-500 transition hover:shadow-lg hover:-translate-y-1">
                    <div className="text-3xl text-red-500 bg-red-50 dark:bg-red-900/30 p-4 rounded-full">
                        <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.breached}</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold">SLA Breaches</p>
                    </div>
                </div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trend Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Support Request Volume</h3>
                    <div className="h-[350px]">
                        <TicketsTrendChart tickets={filteredData} startDate={startDate} endDate={endDate} />
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Operational Status</h3>
                    <div className="h-[350px]">
                        <TicketStatusChart data={statusChartData} />
                    </div>
                </div>

                {/* Departmental Breakdown */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 lg:col-span-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Distribution by Department</h3>
                    <div className="h-[400px]">
                        <DepartmentChart data={departmentChartData} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Priority Breakdown */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Priority Distribution</h3>
                    <div className="space-y-4">
                        {priorityChartData.map(item => {
                            const percentage = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                            const colorClass = item.name === Priority.URGENT ? 'bg-red-500' : 
                                               item.name === Priority.HIGH ? 'bg-orange-500' : 
                                               item.name === Priority.MEDIUM ? 'bg-blue-500' : 'bg-slate-400';
                            return (
                                <div key={item.name} className="space-y-1">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">{item.name}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{item.value} Units ({percentage}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full ${colorClass} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                 {/* SLA Health Indicator */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-primary/10 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                    <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl shadow-xl shadow-primary/20 shrink-0">
                        <i className="fas fa-microchip"></i>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">System Performance Insights</h4>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 leading-relaxed text-sm">
                            {stats.breached > 0 
                                ? `Current analysis identifies ${stats.breached} SLA bottlenecks. High priority tickets in 'IT' and 'Operations' are trending towards expiration. Recommend immediate allocation of technician resources.`
                                : `System is operating at peak efficiency. Resolution rate for the ${timeframe}-day window is at ${stats.resolutionRate}%. No critical SLA breaches detected at this timestamp.`
                            }
                        </p>
                        <div className="mt-4 flex gap-2">
                             <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest">Engine Ready</span>
                             <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">SLA Compliant</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;