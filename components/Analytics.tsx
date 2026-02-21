import React, { useMemo, useState } from 'react';
import { Ticket, TicketStatus, Priority, User, InventoryItem, AssetStatus } from '../types';
import TicketStatusChart from './charts/TicketStatusChart';
import TicketsTrendChart from './charts/TicketsTrendChart';
import DepartmentChart from './charts/DepartmentChart';
import TechnicianChart from './charts/TechnicianChart';
import AssetHealthChart from './charts/AssetHealthChart';
import StatCard from './StatCard';
import { isSlaBreached } from '../utils/sla';

interface AnalyticsProps {
    tickets: Ticket[];
    users: User[];
    departments: string[];
    inventory?: InventoryItem[];
}

const Analytics: React.FC<AnalyticsProps> = ({ tickets, users, departments, inventory = [] }) => {
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
        const resolvedTickets = filteredData.filter(t => t.status === TicketStatus.RESOLVED);
        const resolvedCount = resolvedTickets.length;
        const inProgress = filteredData.filter(t => t.status === TicketStatus.IN_PROGRESS).length;
        const breached = filteredData.filter(t => (t.status !== TicketStatus.RESOLVED) && isSlaBreached(t)).length;
        const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

        // MTTR Calculation (in hours)
        let totalResolutionTime = 0;
        resolvedTickets.forEach(t => {
            if (t.dateResolved) {
                const diff = new Date(t.dateResolved).getTime() - new Date(t.dateCreated).getTime();
                totalResolutionTime += diff;
            }
        });
        const mttrHours = resolvedCount > 0 ? Math.round((totalResolutionTime / resolvedCount) / (1000 * 60 * 60)) : 0;

        // SLA Compliance
        const slaCompliantCount = resolvedTickets.filter(t => !isSlaBreached(t)).length;
        const slaComplianceRate = resolvedCount > 0 ? Math.round((slaCompliantCount / resolvedCount) * 100) : 100;

        return { total, resolved: resolvedCount, inProgress, breached, resolutionRate, mttrHours, slaComplianceRate };
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

    const technicianPerformanceData = useMemo(() => {
        const resolvedInPeriod = filteredData.filter(t => t.status === TicketStatus.RESOLVED && t.assignedTechId);
        const techCounts: Record<string, number> = {};

        resolvedInPeriod.forEach(t => {
            if (t.assignedTechId) {
                techCounts[t.assignedTechId] = (techCounts[t.assignedTechId] || 0) + 1;
            }
        });

        return Object.entries(techCounts).map(([id, count]) => {
            const tech = users.find(u => u.id === id);
            return {
                name: tech ? tech.name : id,
                resolved: count
            };
        }).sort((a, b) => b.resolved - a.resolved).slice(0, 5);
    }, [filteredData, users]);

    const assetHealthData = useMemo(() => {
        if (!inventory || inventory.length === 0) return [];
        const statuses = Object.values(AssetStatus);
        return statuses.map(status => ({
            name: status,
            value: inventory.filter(item => item.assetStatus === status).length
        }));
    }, [inventory]);

    const priorityChartData = useMemo(() => {
        const priorities = Object.values(Priority);
        return priorities.map(p => ({
            name: p,
            value: filteredData.filter(t => t.priority === p).length
        })).sort((a, b) => b.value - a.value);
    }, [filteredData]);

    const startDate = useMemo(() => {
        if (timeframe === 'all' && tickets.length > 0) {
            return tickets.sort((a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime())[0].dateCreated.split('T')[0];
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
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <i className="fas fa-brain"></i>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Analytics Intelligence</h2>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic pl-11">Advanced metrics and system health indicators powered by Vistaran Engine.</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex ml-11 md:ml-0">
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
                <StatCard title="Resolution Rate" value={`${stats.resolutionRate}%`} iconClass="fas fa-check-double text-green-500" />
                <StatCard title="Mean Time To Resolve" value={`${stats.mttrHours}h`} iconClass="fas fa-bolt text-yellow-500" />
                <StatCard title="SLA Compliance" value={`${stats.slaComplianceRate}%`} iconClass="fas fa-shield-alt text-blue-500" />
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl md:rounded-3xl shadow-sm flex items-center space-x-4 border-l-4 border-red-500 transition hover:shadow-md border border-slate-100 dark:border-slate-700">
                    <div className="text-3xl text-red-500 bg-red-50 dark:bg-red-900/30 p-4 rounded-full">
                        <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tighter leading-none">{stats.breached}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Pending Breaches</p>
                    </div>
                </div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trend Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex justify-between items-center">
                        Support Request Volume
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{stats.total} TOTAL</span>
                    </h3>
                    <div className="h-[300px]">
                        <TicketsTrendChart tickets={filteredData} startDate={startDate} endDate={endDate} />
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Operational Status</h3>
                    <div className="h-[300px]">
                        <TicketStatusChart data={statusChartData} />
                    </div>
                </div>

                {/* Technician Performance */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Technician Leaderboard (Top 5)</h3>
                    <div className="h-[300px]">
                        <TechnicianChart data={technicianPerformanceData} />
                    </div>
                </div>

                {/* Asset HealthIndicator */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Inventory Health Ecosystem</h3>
                    <div className="h-[300px]">
                        <AssetHealthChart data={assetHealthData} />
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
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-primary/10 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                    <div className="h-24 w-24 rounded-3xl bg-primary flex items-center justify-center text-white text-4xl shadow-xl shadow-primary/20 shrink-0 transform -rotate-3 hover:rotate-0 transition-transform cursor-default">
                        <i className="fas fa-microchip"></i>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                            System Performance Insights
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 leading-relaxed text-sm font-medium">
                            {stats.breached > 0
                                ? `Current analysis identifies ${stats.breached} SLA bottlenecks. High priority tickets are trending towards expiration. MTTR is currently ${stats.mttrHours} hours. Recommend immediate allocation of technician resources to maintain resolution rates.`
                                : stats.resolved > 0
                                    ? `System is operating at peak efficiency with ${stats.slaComplianceRate}% SLA compliance. Resolution rate for the ${timeframe}-day window is at ${stats.resolutionRate}%. Mean Time To Resolve is optimized at ${stats.mttrHours} hours.`
                                    : `System is in monitoring mode. Data stream initialized for the ${timeframe}-day period. Waiting for resolution sequences to calculate advanced health metrics.`
                            }
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-200 dark:border-green-800">Engine Online</span>
                            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800">AI Verified</span>
                            <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-800">{stats.slaComplianceRate}% Health</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;