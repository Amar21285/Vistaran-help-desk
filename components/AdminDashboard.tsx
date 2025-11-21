import React, { useState, useMemo } from 'react';
import type { Ticket, User } from '../types';
import { TicketStatus, Role, UserStatus } from '../types';
import ServerIcon from './icons/ServerIcon';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeData } from '../hooks/useRealTimeData'; // Added real-time data hook
import { logUserAction } from '../utils/auditLogger';
import { createUser, deleteUser } from '../utils/firebaseService'; // Add Firebase functions

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

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`py-2 px-4 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${
            isActive
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-primary-dark border-b-2 border-primary'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
    >
        {label}
    </button>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ tickets, users, setUsers, onEditUser, setCurrentView, departments }) => {
    const { realUser } = useAuth();
    const { tickets: realTimeTickets, users: realTimeUsers } = useRealTimeData({ pollingInterval: 3000 });
    
    // Use real-time data when available, fallback to props data
    const effectiveTickets = realTimeTickets.length > 0 ? realTimeTickets : tickets;
    const effectiveUsers = realTimeUsers.length > 0 ? realTimeUsers : users;
    
    const [activeTab, setActiveTab] = useState('tickets');
    const [isCreateFormVisible, setCreateFormVisible] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const stats = useMemo(() => {
        const open = effectiveTickets.filter(t => t.status === TicketStatus.OPEN || t.status === TicketStatus.IN_PROGRESS).length;
        const resolved = effectiveTickets.filter(t => t.status === TicketStatus.RESOLVED).length;
        return {
            totalTickets: effectiveTickets.length,
            openTickets: open,
            resolvedTickets: resolved,
            totalUsers: effectiveUsers.length,
        };
    }, [effectiveTickets, effectiveUsers]);
    
    const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
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
        
        try {
            // Create user in Firebase
            const createdUser = await createUser(newUser);
            // Update local state
            setUsers(prev => [...prev, createdUser]);
            logUserAction(realUser, `Created new user from dashboard: ${createdUser.name} (ID: ${createdUser.id})`);
            alert(`User ${createdUser.name} created successfully.`);
            e.currentTarget.reset();
            setCreateFormVisible(false);
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user. Please try again.');
        }
    };

    const handleDeleteUser = (user: User) => {
        if (realUser?.id === user.id) {
            alert("For security, you cannot delete your own account.");
            return;
        }
        setUserToDelete(user);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        
        try {
            // Delete user from Firebase
            await deleteUser(userToDelete.id);
            // Update local state
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            logUserAction(realUser, `Deleted user from dashboard: ${userToDelete.name} (ID: ${userToDelete.id})`);
            setUserToDelete(null);
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user. Please try again.');
        }
    };


    return (
        <div className="space-y-6">
            <header className="bg-slate-800 dark:bg-slate-900/50 text-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold">Help Desk Admin Dashboard</h1>
                <p className="mt-1 text-slate-300">System-wide overview, statistics, and server status.</p>
                {realTimeTickets.length > 0 && (
                    <div className="mt-2 flex items-center text-sm text-green-400">
                        <i className="fas fa-sync-alt mr-2 animate-spin"></i>
                        Real-time updates enabled
                    </div>
                )}
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
                <nav className="flex space-x-2">
                    <TabButton label="Recent Tickets" isActive={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')} />
                    <TabButton label="Manage Users" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <TabButton label="System Logs" isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                </nav>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md min-h-[300px]">
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
                                    {effectiveUsers.map(user => (
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
                                    {[...effectiveTickets].sort((a,b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()).slice(0, 5).map(ticket => (
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
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">System Logs</h3>
                         <div className="flex flex-wrap gap-4 my-4">
                            <button onClick={() => alert('Refreshing logs...')} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">Refresh Logs</button>
                            <button onClick={() => confirm('Are you sure you want to clear logs?') && alert('Logs cleared.')} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">Clear Logs</button>
                         </div>
                        <div className="bg-slate-900 text-green-300 font-mono text-xs p-4 rounded-lg h-64 overflow-y-auto">
                            <p>[{new Date().toLocaleString()}] INFO: Server started on port 3000</p>
                            <p>[{new Date(Date.now() - 1000).toLocaleString()}] INFO: Database connected successfully</p>
                            <p>[{new Date(Date.now() - 2000).toLocaleString()}] INFO: Email service configured</p>
                            <p>[{new Date(Date.now() - 300000).toLocaleString()}] AUTH: User ITsupport@vistaran.in logged in</p>
                            <p>[{new Date(Date.now() - 1800000).toLocaleString()}] TICKET: New ticket created: TKT001</p>
                            <p>[{new Date(Date.now() - 2500000).toLocaleString()}] EMAIL: Notification sent for ticket TKT002</p>
                            <p>[{new Date(Date.now() - 3600000).toLocaleString()}] TICKET: Ticket TKT003 marked as resolved</p>
                        </div>
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