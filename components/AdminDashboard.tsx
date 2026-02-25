import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, User, TicketStatus, Role, UserStatus, AuditLogEntry } from '../types';
import ServerIcon from './icons/ServerIcon';
import { useAuth } from '../hooks/useAuth';
import { logUserAction } from '../utils/auditLogger';
import Analytics from './Analytics';

interface AdminDashboardProps {
    tickets: Ticket[];
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    onEditUser: (user: User) => void;
    setCurrentView: (view: string) => void;
    departments: string[];
}

const StatItem: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
    <div className="text-center p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
        <div className="text-3xl font-bold text-primary dark:text-primary-dark">{value}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
);

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; iconClass?: string }> = ({ label, isActive, onClick, iconClass }) => (
    <button
        onClick={onClick}
        className={`py-2 px-4 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none flex items-center gap-2 ${
            isActive
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-primary-dark border-b-2 border-primary'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
    >
        {iconClass && <i className={iconClass}></i>}
        {label}
    </button>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ tickets, users, setUsers, onEditUser, setCurrentView, departments }) => {
    const { realUser } = useAuth();
    const [activeTab, setActiveTab] = useState('analytics'); 
    const [isCreateFormVisible, setCreateFormVisible] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

    useEffect(() => {
        const fetchLogs = () => {
            const logsStr = localStorage.getItem('vistaran-helpdesk-auditlog');
            if (logsStr) {
                setAuditLogs(JSON.parse(logsStr));
            }
        };
        fetchLogs();
        // Set up an interval to refresh logs occasionally while the dashboard is open
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const open = tickets.filter(t => t.status === TicketStatus.OPEN || t.status === TicketStatus.IN_PROGRESS).length;
        const resolved = tickets.filter(t => t.status === TicketStatus.RESOLVED).length;
        return {
            totalTickets: tickets.length,
            openTickets: open,
            resolvedTickets: resolved,
            totalUsers: users.length,
        };
    }, [tickets, users]);
    
    const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newUser: User = {
            id: `USR${Date.now()}`,
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            role: formData.get('role') as Role,
            department: formData.get('department') as string,
            status: formData.get('status') as UserStatus,
            joinedDate: new Date().toISOString(),
        };
        setUsers(prev => [...prev, newUser]);
        logUserAction(realUser, `Created new user from dashboard: ${newUser.name} (ID: ${newUser.id})`);
        alert(`User ${newUser.name} created successfully.`);
        e.currentTarget.reset();
        setCreateFormVisible(false);
    };

    const handleDeleteUser = (user: User) => {
        if (realUser?.id === user.id) {
            alert("For security, you cannot delete your own account.");
            return;
        }
        setUserToDelete(user);
    };

    const confirmDeleteUser = () => {
        if (!userToDelete) return;
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        logUserAction(realUser, `Deleted user from dashboard: ${userToDelete.name} (ID: ${userToDelete.id})`);
        setUserToDelete(null);
    };

    const handleClearLogs = () => {
        if (confirm("Are you sure you want to clear all system logs? This cannot be undone.")) {
            localStorage.setItem('vistaran-helpdesk-auditlog', JSON.stringify([]));
            setAuditLogs([]);
            logUserAction(realUser, "Cleared all system audit logs.");
        }
    };

    return (
        <div className="space-y-6">
            <header className="bg-slate-800 dark:bg-slate-900/50 text-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold">Help Desk Admin Dashboard</h1>
                <p className="mt-1 text-slate-300">System-wide overview, statistics, and server status.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md md:col-span-1">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-700 pb-2 mb-4">Server Status</h3>
                    <div className="space-y-3 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center space-x-3">
                            <ServerIcon className="text-green-500" />
                            <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                            <span>Server is running</span>
                        </div>
                        <p><strong>Uptime:</strong> 2 days, 14 hours, 32 minutes</p>
                        <p><strong>Memory usage:</strong> 87 MB</p>
                    </div>
                    <button onClick={() => alert('Refreshing server status...')} className="mt-4 w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg transition">Refresh Status</button>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md md:col-span-1">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-700 pb-2 mb-4">System Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <StatItem label="Total Tickets" value={stats.totalTickets} />
                        <StatItem label="Open Tickets" value={stats.openTickets} />
                        <StatItem label="Total Users" value={stats.totalUsers} />
                        <StatItem label="Resolved" value={stats.resolvedTickets} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md md:col-span-1">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-700 pb-2 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button onClick={() => setCurrentView('users')} className="w-full flex items-center justify-center space-x-3 bg-primary text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-primary-hover transition text-base"><i className="fas fa-users-cog w-5"></i><span>Manage Users</span></button>
                        <button onClick={() => setCurrentView('reports')} className="w-full flex items-center justify-center space-x-3 bg-green-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-green-700 transition text-base"><i className="fas fa-chart-line w-5"></i><span>View Reports</span></button>
                        <button onClick={() => setCurrentView('app-settings')} className="w-full flex items-center justify-center space-x-3 bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-slate-800 transition text-base"><i className="fas fa-cogs w-5"></i><span>App Settings</span></button>
                        <button onClick={() => setCurrentView('create-ticket')} className="w-full flex items-center justify-center space-x-3 bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-600 transition text-base"><i className="fas fa-plus-circle w-5"></i><span>New Ticket</span></button>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <nav className="flex space-x-2 overflow-x-auto no-scrollbar">
                    <TabButton label="Analytics" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} iconClass="fas fa-chart-bar" />
                    <TabButton label="Recent Tickets" isActive={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')} iconClass="fas fa-ticket-alt" />
                    <TabButton label="Manage Users" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} iconClass="fas fa-users" />
                    <TabButton label="System Logs" isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} iconClass="fas fa-terminal" />
                </nav>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md min-h-[300px]">
                {activeTab === 'analytics' && (
                    <Analytics tickets={tickets} users={users} departments={departments} />
                )}
                {activeTab === 'users' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manage All Users</h3>
                            <button onClick={() => setCreateFormVisible(p => !p)} className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition flex items-center gap-2">
                                <i className="fas fa-user-plus"></i> Create New User
                            </button>
                        </div>
                        
                        {isCreateFormVisible && (
                             <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-lg shadow-inner my-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Create New User Form</h3>
                                <form onSubmit={handleCreateUser} className="space-y-4">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Full Name *</label>
                                            <input type="text" name="name" required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email Address *</label>
                                            <input type="email" name="email" required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Password *</label>
                                            <input type="password" name="password" required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" />
                                        </div>
                                         <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Role *</label>
                                            <select name="role" required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                                <option value={Role.USER}>User</option>
                                                <option value={Role.ADMIN}>Admin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Department *</label>
                                            <select name="department" defaultValue={departments[0] || ''} required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                                 {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Status *</label>
                                            <select name="status" required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                                <option value={UserStatus.ACTIVE}>Active</option>
                                                <option value={UserStatus.INACTIVE}>Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="submit" className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition">Create User</button>
                                        <button type="button" onClick={() => setCreateFormVisible(false)} className="bg-slate-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="overflow-x-auto mt-4">
                             <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.name}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{user.role}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button onClick={() => onEditUser(user)} className="text-primary hover:text-blue-900" title="Edit User"><i className="fas fa-edit"></i></button>
                                                <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-900" title="Delete User" disabled={realUser?.id === user.id}><i className="fas fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'tickets' && (
                     <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Tickets</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                    {[...tickets].sort((a,b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()).slice(0, 5).map(ticket => (
                                        <tr key={ticket.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-100">{ticket.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 max-w-sm truncate">{ticket.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{ticket.status}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(ticket.dateCreated).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                 {activeTab === 'logs' && (
                     <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Live System Audit Logs</h3>
                             <div className="flex flex-wrap gap-2">
                                <button onClick={() => alert('Feature coming soon: Export to CSV')} className="bg-emerald-600 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-emerald-700 transition text-xs flex items-center gap-2">
                                    <i className="fas fa-file-csv"></i> Export
                                </button>
                                <button onClick={handleClearLogs} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-3 rounded-lg transition text-xs flex items-center gap-2">
                                    <i className="fas fa-trash"></i> Clear Logs
                                </button>
                             </div>
                        </div>
                        <div className="bg-slate-900 text-green-300 font-mono text-xs p-4 rounded-lg h-96 overflow-y-auto shadow-inner border border-slate-700">
                            {auditLogs.length > 0 ? auditLogs.map(log => (
                                <p key={log.id} className="mb-1.5 leading-relaxed">
                                    <span className="text-slate-500">[{new Date(log.timestamp).toLocaleString()}]</span>{' '}
                                    <span className="text-blue-400 font-bold">{log.userName}</span>{' '}
                                    <span className="text-slate-400">({log.ip})</span>:{' '}
                                    <span className="text-green-100">{log.action}</span>
                                </p>
                            )) : (
                                <p className="text-slate-500 italic">No audit entries found. System is waiting for activity...</p>
                            )}
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 uppercase font-black tracking-widest text-center">
                            End of Log Stream
                        </p>
                    </div>
                )}
            </div>

            {userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center modal-content">
                        <div className="text-red-500 mb-4"><i className="fas fa-exclamation-triangle fa-3x"></i></div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Confirm Deletion</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4">Are you sure you want to permanently delete the user <strong className="font-semibold">{userToDelete.name}</strong>?<br /><strong className="text-red-600">This action is irreversible.</strong></p>
                        <div className="flex justify-center gap-4 mt-6">
                            <button onClick={() => setUserToDelete(null)} className="bg-slate-200 text-slate-700 font-semibold px-6 py-2 rounded-lg hover:bg-slate-300 transition">Cancel</button>
                            <button onClick={confirmDeleteUser} className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-700 transition">Delete User</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;