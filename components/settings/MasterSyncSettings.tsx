
import React, { useState } from 'react';

const MasterSyncSettings: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSync = async () => {
        setStatus('loading');
        setMessage('Triggering server-side restoration...');
        try {
            // First trigger server-side restoration
            const restoreResponse = await fetch('/api/admin/restore-from-master', {
                method: 'POST'
            });

            if (!restoreResponse.ok) {
                const errorData = await restoreResponse.json();
                throw new Error(errorData.error || 'Server restoration failed');
            }

            setMessage('Server restored. Fetching master data for local sync...');
            const response = await fetch('/Vistaran_Master_Sync.json');
            if (!response.ok) throw new Error('Failed to fetch master data file.');
            
            const data = await response.json();
            
            setMessage('Master data acquired. Synchronizing local storage...');
            
            // Iterate over all keys in the JSON and save to localStorage
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, JSON.stringify(data[key]));
            });
            
            setStatus('success');
            setMessage('Synchronization complete! The application will now reload to apply changes.');
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Sync error:', err);
            setStatus('error');
            setMessage(`Sync failed: ${err.message}`);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[35px] shadow-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-xl">
                    <i className="fas fa-sync-alt"></i>
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Master Data Sync</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Restore application state from Vistaran Master Backup</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-800">
                    <div className="flex gap-4">
                        <i className="fas fa-exclamation-triangle text-amber-500 text-xl mt-1"></i>
                        <div>
                            <h4 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight">Warning: Data Overwrite</h4>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-500/80 mt-1 leading-relaxed">
                                Synchronizing with the Master Backup will overwrite all current local data (Tickets, Users, Inventory, etc.) with the data stored in the master file. This action cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-[30px] gap-6">
                    {status === 'idle' && (
                        <>
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Ready to synchronize with Master Backup</p>
                                <p className="text-[10px] text-slate-400 uppercase font-black mt-1">File: Vistaran_Master_Sync.json</p>
                            </div>
                            <button 
                                onClick={handleSync}
                                className="bg-primary text-white font-black px-12 py-4 rounded-2xl shadow-xl hover:bg-primary-hover active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center gap-3"
                            >
                                <i className="fas fa-cloud-download-alt"></i> Start Master Sync
                            </button>
                        </>
                    )}

                    {status === 'loading' && (
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 text-2xl">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <p className="text-sm font-black text-emerald-600 uppercase tracking-tight">{message}</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto text-rose-500 text-2xl">
                                <i className="fas fa-times-circle"></i>
                            </div>
                            <p className="text-sm font-black text-rose-600 uppercase tracking-tight">{message}</p>
                            <button 
                                onClick={() => setStatus('idle')}
                                className="text-[10px] font-black text-slate-400 uppercase underline tracking-widest"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MasterSyncSettings;
