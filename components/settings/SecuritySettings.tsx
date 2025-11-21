import React, { useState, useEffect } from 'react';
import ToggleSwitch from '../ToggleSwitch';
import TwoFactorAuthModal from '../modals/TwoFactorAuthModal';
import type { AuditLogEntry } from '../../types';

const SecuritySettings: React.FC = () => {
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

    return (
        <>
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Access & Security</h3>
                    <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
                        <ToggleSwitch 
                            label="Enable Two-Factor Authentication (2FA)"
                            description="Require a second verification step for all users upon login."
                            enabled={is2faEnabled}
                            onChange={(enabled) => {
                                if (enabled) { // Trying to turn it ON
                                    setIs2faModalOpen(true);
                                } else { // Trying to turn it OFF
                                    if (window.confirm("Are you sure you want to disable Two-Factor Authentication?")) {
                                        setIs2faEnabled(false);
                                        alert("2FA disabled.");
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Password Policy</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-md">
                            <span className="font-semibold">Minimum Length:</span> 8 characters
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-md">
                            <span className="font-semibold">Requires Uppercase:</span> Yes
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-md">
                            <span className="font-semibold">Requires Number:</span> Yes
                        </div>
                         <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-md">
                            <span className="font-semibold">Requires Symbol:</span> No
                        </div>
                    </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">* Password policies are enforced by the backend and cannot be changed here.</p>
                </div>


                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Audit Log</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                View a log of important actions performed by users in the system.
                            </p>
                        </div>
                         <button onClick={fetchLogs} className="bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition flex items-center gap-2 text-sm">
                            <i className="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg max-h-96">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">IP Address</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {auditLogs.length > 0 ? auditLogs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{log.userName}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 break-words">{log.action}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{log.ip}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-slate-500 dark:text-slate-400">No audit logs found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
             {is2faModalOpen && (
                <TwoFactorAuthModal
                    onClose={() => setIs2faModalOpen(false)}
                    onEnable={() => {
                        setIs2faEnabled(true);
                        setIs2faModalOpen(false);
                        alert("Two-Factor Authentication has been enabled successfully!");
                    }}
                />
            )}
        </>
    );
};

export default SecuritySettings;