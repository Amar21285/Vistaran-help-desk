import React, { useState, useEffect, useMemo } from 'react';
import { AuditLogEntry } from '../../types';

export const AuditLogView: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        // Load logs from localStorage as per app architecture
        try {
            const savedLogs = localStorage.getItem('vistaran-helpdesk-audit-logs');
            if (savedLogs) {
                setLogs(JSON.parse(savedLogs));
            }
        } catch (error) {
            console.error("Failed to load audit logs:", error);
        }
    }, []);

    const filteredLogs = useMemo(() => {
        return logs
            .filter(log => 
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.ip.includes(searchTerm)
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [logs, searchTerm]);

    const paginatedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">System Audit Logs</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor user actions, security events, and system changes.</p>
                </div>
                <div className="relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                        type="text" 
                        placeholder="Search logs..." 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="pl-12 pr-4 py-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">User</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {paginatedLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                                        {log.userName}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('failed')
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                                            : log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('add')
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-500">
                                        {log.ip || 'N/A'}
                                    </td>
                                </tr>
                            ))}
                            {paginatedLogs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <i className="fas fa-clipboard-list text-4xl text-slate-300"></i>
                                            <p>No audit logs found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
                        <span className="text-xs text-slate-500 font-medium">
                            Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <i className="fas fa-chevron-left text-xs"></i>
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <i className="fas fa-chevron-right text-xs"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogView;
