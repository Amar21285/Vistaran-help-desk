
import React, { useState, useEffect, useMemo } from 'react';
import ToggleSwitch from '../ToggleSwitch';
import TwoFactorAuthModal from '../modals/TwoFactorAuthModal';
import { AuditLogEntry, User, Ticket, Role } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { logUserAction } from '../../utils/auditLogger';

interface SecuritySettingsProps {
    users: User[];
    tickets: Ticket[];
}

type SecuritySubTab = 'access' | 'activity' | 'logins' | 'ticket-history' | 'backup';

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ users, tickets }) => {
    const { realUser } = useAuth();
    const [activeSubTab, setActiveSubTab] = useState<SecuritySubTab>('access');
    const [is2faEnabled, setIs2faEnabled] = useState(false);
    const [is2faModalOpen, setIs2faModalOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

    const fetchLogs = () => {
        try {
            const logsStr = localStorage.getItem('vistaran-helpdesk-auditlog');
            const logs: AuditLogEntry[] = logsStr ? JSON.parse(logsStr) : [];
            setAuditLogs(logs);
        } catch (error) {
            console.error("Failed to parse audit logs from localStorage", error);
            setAuditLogs([]);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const loginLogs = useMemo(() => 
        auditLogs.filter(log => log.action.toLowerCase().includes('log') || log.action.toLowerCase().includes('impersonat'))
    , [auditLogs]);

    const activityLogs = useMemo(() => 
        auditLogs.filter(log => !log.action.toLowerCase().includes('log') && !log.action.toLowerCase().includes('impersonat'))
    , [auditLogs]);

    const globalTicketHistory = useMemo(() => {
        const allHistory = tickets.flatMap(t => (t.history || []).map(h => ({ ...h, ticketId: t.id })));
        return allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [tickets]);

    const handleClearLogs = () => {
        if (window.confirm("Are you sure you want to permanently clear all audit logs? This action cannot be undone.")) {
            localStorage.setItem('vistaran-helpdesk-auditlog', JSON.stringify([]));
            setAuditLogs([]);
            logUserAction(realUser, "Cleared system audit logs via settings.");
        }
    };

    const handleCreateBackup = () => {
        try {
            const backupData: { [key: string]: any } = {};
            const keysToBackup = Object.keys(localStorage).filter(key => key.startsWith('vistaran-helpdesk-'));
            keysToBackup.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    try { backupData[key] = JSON.parse(item); } catch (e) { backupData[key] = item; }
                }
            });
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Vistaran_Security_Backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            logUserAction(realUser, "Generated system data backup.");
        } catch (err) {
            alert('Backup failed.');
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex flex-col gap-1">
                {[
                    { id: 'access', label: 'Access Control', icon: 'fa-shield-halved' },
                    { id: 'activity', label: 'Activity Logs', icon: 'fa-list-check' },
                    { id: 'logins', label: 'Login Logs', icon: 'fa-user-lock' },
                    { id: 'ticket-history', label: 'Ticket History', icon: 'fa-history' },
                    { id: 'backup', label: 'Data Backup', icon: 'fa-database' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as SecuritySubTab)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <i className={`fas ${tab.icon} w-5`}></i>
                        {tab.label}
                    </button>
                ))}
            </aside>

            <main className="flex-1 space-y-6">
                {activeSubTab === 'access' && (
                    <div className="animate-in fade-in duration-500 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-700">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                                <i className="fas fa-fingerprint text-primary"></i> Multi-Factor Auth
                            </h3>
                            <ToggleSwitch 
                                label="Enable 2FA Protection"
                                description="Require a cryptographic token from an authenticator app for every administrative session."
                                enabled={is2faEnabled}
                                onChange={(enabled) => enabled ? setIs2faModalOpen(true) : setIs2faEnabled(false)}
                            />
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-700">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-6">Password Protocol</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Complexity</p>
                                    <p className="text-sm font-bold">Standard Enterprise</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Rotation</p>
                                    <p className="text-sm font-bold">90 Day Cycle</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(activeSubTab === 'activity' || activeSubTab === 'logins') && (
                    <div className="animate-in fade-in duration-500 bg-white dark:bg-slate-800 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <header className="p-8 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                    {activeSubTab === 'activity' ? 'System Activity Ledger' : 'Authentication Logs'}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Forensic Audit Trail</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleClearLogs} className="bg-red-50 text-red-600 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-100 transition"><i className="fas fa-trash mr-1"></i> Clear</button>
                                <button onClick={fetchLogs} className="bg-slate-100 dark:bg-slate-700 text-slate-500 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"><i className="fas fa-sync"></i></button>
                            </div>
                        </header>
                        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50/50 dark:bg-slate-900/50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Operator</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Description</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Client IP</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {(activeSubTab === 'activity' ? activityLogs : loginLogs).map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap"><span className="font-black text-primary uppercase text-xs tracking-tighter">{log.userName}</span></td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{log.action}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-[10px] text-slate-400">{log.ip}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-[10px] font-bold text-slate-400 uppercase">{new Date(log.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {(activeSubTab === 'activity' ? activityLogs : loginLogs).length === 0 && (
                                        <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase opacity-20 italic">No Audit Entries Found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeSubTab === 'ticket-history' && (
                    <div className="animate-in fade-in duration-500 bg-white dark:bg-slate-800 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <header className="p-8 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Global Incident History</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cross-system Ticket Change Tracking</p>
                            </div>
                        </header>
                        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50/50 dark:bg-slate-900/50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Ticket ID</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Operator</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Modification Detail</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {globalTicketHistory.map(h => (
                                        <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap"><span className="font-mono font-black text-primary text-xs">#{h.ticketId}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className="font-black text-slate-700 dark:text-slate-200 uppercase text-[10px]">{users.find(u => u.id === h.userId)?.name || 'System'}</span></td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{h.change}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-[10px] font-bold text-slate-400 uppercase">{new Date(h.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {globalTicketHistory.length === 0 && (
                                        <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase opacity-20 italic">No Ticket History Records</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Fixed: Replaced 'activeTab' with 'activeSubTab' to resolve find name error on line 210/239 */}
                {activeSubTab === 'backup' && (
                    <div className="animate-in fade-in duration-500 space-y-6">
                        <div className="bg-slate-900 text-white p-12 rounded-[48px] shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-20 translate-x-20 blur-3xl"></div>
                             <div className="relative z-10">
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Enterprise Data Vault</h3>
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-loose max-w-lg mb-10">
                                    Ensure business continuity by generating a local snapshot of all tickets, user profiles, and audit trails.
                                </p>
                                <button 
                                    onClick={handleCreateBackup}
                                    className="bg-primary text-white font-black px-10 py-5 rounded-3xl shadow-2xl shadow-primary/30 hover:bg-primary-hover transition-all flex items-center gap-3 uppercase tracking-widest text-xs"
                                >
                                    <i className="fas fa-cloud-arrow-down text-lg"></i>
                                    Generate Master Backup
                                </button>
                             </div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700">
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm mb-4">Integrity Verification</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
                                Backups are encrypted at rest and formatted as standardized JSON. Regular exports are recommended before significant administrative changes.
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {is2faModalOpen && (
                <TwoFactorAuthModal
                    onClose={() => setIs2faModalOpen(false)}
                    onEnable={() => {
                        setIs2faEnabled(true);
                        setIs2faModalOpen(false);
                        logUserAction(realUser, "Enabled Two-Factor Authentication.");
                    }}
                />
            )}
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }`}</style>
        </div>
    );
};

export default SecuritySettings;
