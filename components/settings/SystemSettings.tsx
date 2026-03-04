
import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';
import { logUserAction } from '../../utils/auditLogger';
import { useAuth } from '../../hooks/useAuth';

// IndexedDB Helper to store the FileSystemDirectoryHandle
const DB_NAME = 'VistaranSyncDB';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'syncFolder';

const saveHandleToDB = async (handle: any) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    return new Promise((resolve) => {
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
            tx.oncomplete = () => resolve(true);
        };
    });
};

const getHandleFromDB = async (): Promise<any> => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    return new Promise((resolve) => {
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(STORE_NAME, 'readonly');
            const getReq = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
            getReq.onsuccess = () => resolve(getReq.result);
        };
    });
};

const SystemActionCard: React.FC<{ title: string; description: string; buttonText: string; buttonIcon: string; onClick: () => void; buttonClass?: string; }> = ({ title, description, buttonText, buttonIcon, onClick, buttonClass = 'bg-blue-600 hover:bg-blue-700' }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center gap-4 transition-all hover:shadow-md">
        <div className="flex-grow">
            <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 uppercase tracking-tighter">{title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
        <button
            onClick={onClick}
            className={`w-full md:w-auto text-white font-black px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2 uppercase tracking-widest text-xs shadow-lg ${buttonClass}`}
        >
            <i className={buttonIcon}></i>
            {buttonText}
        </button>
    </div>
);

const ConfirmationModal: React.FC<{ title: string; body: string; onConfirm: () => void; onClose: () => void; }> = ({ title, body, onConfirm, onClose }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4 modal-backdrop">
        <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-10 w-full max-w-md text-center modal-content border border-white/10">
            <div className="text-amber-500 mb-6">
                <i className="fas fa-exclamation-triangle fa-4x animate-bounce"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">{title}</h2>
            <p className="text-slate-600 dark:text-slate-300 my-6 font-medium leading-relaxed">{body}</p>
            <div className="flex flex-col gap-3">
                <button
                    onClick={onConfirm}
                    className="bg-amber-600 text-white font-black py-4 rounded-2xl hover:bg-amber-700 transition uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20"
                >
                    Confirm Action
                </button>
                <button
                    onClick={onClose}
                    className="text-slate-400 font-black py-3 uppercase tracking-widest text-[10px] hover:text-slate-600"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

const SystemSettings: React.FC = () => {
    const { resetSettings } = useSettings();
    const { resetTheme } = useTheme();
    const { realUser, user } = useAuth();
    const [modalContent, setModalContent] = useState<{ title: string; body: string; onConfirm: () => void; } | null>(null);
    const [isYearEndModalOpen, setIsYearEndModalOpen] = useState(false);
    const [hasServerBackup, setHasServerBackup] = useState(false);

    // --- Local Drive Sync State ---
    const [syncHandle, setSyncHandle] = useState<any>(null);
    const [isSyncActive, setIsSyncActive] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [hasStoredPath, setHasStoredPath] = useState(false);

    useEffect(() => {
        const loadPersistedHandle = async () => {
            const handle = await getHandleFromDB();
            if (handle) {
                setSyncHandle(handle);
                setHasStoredPath(true);
                const permission = await handle.queryPermission({ mode: 'readwrite' });
                if (permission === 'granted') {
                    setIsSyncActive(true);
                }
            }
        };
        loadPersistedHandle();
        
        // Check for server backup file
        const checkServerBackup = async () => {
            try {
                const response = await fetch('/Vistaran_Master_Sync.json', { method: 'HEAD' });
                if (response.ok) setHasServerBackup(true);
            } catch (e) {
                console.log("No server backup found");
            }
        };
        checkServerBackup();
    }, []);

    const getAllAppData = () => {
        const backupData: { [key: string]: any } = {};
        const keysToBackup = Object.keys(localStorage).filter(key => key.startsWith('vistaran-helpdesk-'));
        keysToBackup.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                try { backupData[key] = JSON.parse(item); } catch (e) { backupData[key] = item; }
            }
        });
        return JSON.stringify(backupData, null, 2);
    };

    const performLocalWrite = async (handle: any) => {
        try {
            const fileHandle = await handle.getFileHandle('Vistaran_Master_Sync.json', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(getAllAppData());
            await writable.close();
            setLastSyncTime(new Date().toLocaleTimeString());
            return true;
        } catch (err) {
            console.error("Local write failed:", err);
            setIsSyncActive(false);
            return false;
        }
    };

    const handleSelectSyncFolder = async () => {
        try {
            // @ts-ignore
            const handle = await window.showDirectoryPicker();
            setSyncHandle(handle);
            await saveHandleToDB(handle);
            const success = await performLocalWrite(handle);
            if (success) {
                setIsSyncActive(true);
                setHasStoredPath(true);
                logUserAction(realUser || user, "Established Real-time Local Drive Sync.");
            }
        } catch (err) {
            console.error("Directory picker error:", err);
        }
    };

    const handleResumeSync = async () => {
        if (!syncHandle) return;
        try {
            const permission = await syncHandle.requestPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
                setIsSyncActive(true);
                performLocalWrite(syncHandle);
            }
        } catch (err) {
            console.error("Failed to resume sync:", err);
            alert("Could not access the previously selected folder. Please re-set the path.");
            setHasStoredPath(false);
        }
    };

    useEffect(() => {
        if (!isSyncActive || !syncHandle) return;
        const syncInterval = setInterval(() => performLocalWrite(syncHandle), 15000);
        return () => clearInterval(syncInterval);
    }, [isSyncActive, syncHandle]);

    // --- Restore Data Actions ---
    const handleCreateBackup = async (quiet = false) => {
        try {
            const backupJSON = getAllAppData();
            const blob = new Blob([backupJSON], { type: 'application/json' });
            const date = new Date().toISOString().split('T')[0];
            const fileName = `Vistaran_Backup_Archive_${date}.json`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if(!quiet) alert(`Backup successful! File saved as ${fileName}.`);
            return true;
        } catch (err) {
            console.error('Backup failed:', err);
            if(!quiet) alert('An error occurred during the backup process.');
            return false;
        }
    };

    const handleRestoreBackup = () => {
        const applyRestore = (jsonString: string) => {
            try {
                const backupData = JSON.parse(jsonString);
                if (typeof backupData !== 'object') throw new Error('Invalid backup file format.');
                Object.keys(localStorage).forEach(key => { if (key.startsWith('vistaran-helpdesk-')) localStorage.removeItem(key); });
                for (const key in backupData) {
                    if (key.startsWith('vistaran-helpdesk-')) {
                        const value = backupData[key];
                        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                    }
                }
                alert("Data Recovery Successful! System will now restart.");
                window.location.reload();
            } catch (error: any) {
                alert(`Recovery failed. Error: ${error.message}`);
            }
        };

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                if (content && confirm("Warning: This will overwrite ALL existing data. Proceed?")) applyRestore(content);
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handlePerformYearEnd = async () => {
        const backupSuccess = await handleCreateBackup(true);
        if (!backupSuccess) {
            alert("Critical Error: Could not generate safety backup. Year-end process aborted.");
            return;
        }
        localStorage.setItem('vistaran-helpdesk-tickets', JSON.stringify([]));
        localStorage.setItem('vistaran-helpdesk-challans', JSON.stringify([]));
        localStorage.setItem('vistaran-helpdesk-outward-invoices', JSON.stringify([]));
        localStorage.setItem('vistaran-helpdesk-purchase-orders', JSON.stringify([]));
        localStorage.setItem('vistaran-helpdesk-reimbursements', JSON.stringify([]));
        localStorage.setItem('vistaran-helpdesk-notifications', JSON.stringify([]));
        localStorage.setItem('vistaran-helpdesk-auditlog', JSON.stringify([]));
        logUserAction(realUser || user, "PERFORMED FISCAL YEAR CLOSING.");
        alert("Year-End complete! Logistics records reset.");
        window.location.reload();
    };

    const handleRestoreSettings = () => {
        setModalContent({
            title: "Reset Application Settings",
            body: "Are you sure you want to reset all theme, logo, and notification settings to their defaults?",
            onConfirm: () => {
                resetTheme();
                resetSettings();
                setModalContent(null);
            }
        });
    };
    
    const handleResetData = () => {
         setModalContent({
            title: "Factory Data Reset",
            body: "CRITICAL: This will permanently delete ALL tickets, users, and inventory from this browser. Use only if you have a backup or want to start fresh.",
            onConfirm: () => {
                Object.keys(localStorage).forEach(key => { if(key.startsWith('vistaran-helpdesk-')) localStorage.removeItem(key); });
                setModalContent(null);
                window.location.reload();
            }
        });
    };

    return (
        <>
            <div className="space-y-6">
                {/* 1. REAL-TIME DATA SAFETY (HINDI INSTRUCTIONS ADDED) */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-10 rounded-[50px] shadow-2xl relative overflow-hidden border border-white/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-20 translate-x-20"></div>
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                        <div className="space-y-4 max-w-2xl">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${isSyncActive ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
                                    <i className={`fas ${isSyncActive ? 'fa-cloud-arrow-down' : 'fa-shield-halved'}`}></i>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">Data Auto-Recovery Hub</h3>
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Real-time Local Disk Backup</p>
                                </div>
                            </div>
                            <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5 space-y-4">
                                <p className="text-emerald-50 text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                                    <i className="fas fa-info-circle"></i> Data Kaise Bachayein? (How to Protect Data)
                                </p>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {hasStoredPath 
                                        ? "Aapka sync folder set hai. Website har 15 seconds mein data save karti rahegi. Agar kabhi browser se data gayab ho jaye, toh bas folder se JSON file ko 'Restore' kar lein."
                                        : "Niche diye gaye button par click karke apne computer ka koi ek folder select karein. Ye website us folder mein aapka sara data auto-save karti rahegi taaki browser delete hone par bhi aapka data safe rahe."}
                                </p>
                            </div>
                            {isSyncActive && (
                                <div className="flex items-center gap-4 text-emerald-400 font-black uppercase text-[10px] tracking-widest bg-emerald-500/10 px-6 py-3 rounded-full w-fit border border-emerald-500/20">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                    Sync Protocol Active • Last Saved: {lastSyncTime}
                                </div>
                            )}
                        </div>
                        <div className="shrink-0">
                            {!isSyncActive ? (
                                hasStoredPath ? (
                                    <button onClick={handleResumeSync} className="bg-emerald-600 text-white font-black px-12 py-6 rounded-[30px] shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-emerald-500/20"><i className="fas fa-play"></i> Resume Sync</button>
                                ) : (
                                    <button onClick={handleSelectSyncFolder} className="bg-primary text-white font-black px-12 py-6 rounded-[30px] shadow-2xl hover:bg-primary-hover active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-primary/20"><i className="fas fa-folder-tree"></i> Enable Auto-Save</button>
                                )
                            ) : (
                                <button onClick={() => setIsSyncActive(false)} className="bg-rose-600 text-white font-black px-12 py-6 rounded-[30px] shadow-2xl hover:bg-rose-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-rose-500/20"><i className="fas fa-power-off"></i> Suspend Sync</button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. MANUAL RECOVERY ACTIONS */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter mb-6">Manual Recovery Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SystemActionCard 
                            title="Generate Instant Archive"
                            description="Manually download a complete snapshot of the database to your local machine."
                            buttonText="Export JSON"
                            buttonIcon="fas fa-download"
                            onClick={() => handleCreateBackup()}
                        />
                        <SystemActionCard 
                            title="Restore From Backup"
                            description="Use a previously downloaded JSON file to restore your entire database."
                            buttonText="Restore Data"
                            buttonIcon="fas fa-upload"
                            onClick={handleRestoreBackup}
                            buttonClass="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                        />
                        {hasServerBackup && (
                            <SystemActionCard 
                                title="Import Server Backup"
                                description="Found 'Vistaran_Master_Sync.json' on server. Click to import this data."
                                buttonText="Import Now"
                                buttonIcon="fas fa-cloud-download-alt"
                                onClick={async () => {
                                    try {
                                        const response = await fetch('/Vistaran_Master_Sync.json');
                                        if (!response.ok) throw new Error('Could not fetch server backup.');
                                        const content = await response.text();
                                        if (confirm("Warning: This will overwrite ALL existing data with the server backup. Proceed?")) {
                                            // Re-using the logic from handleRestoreBackup
                                            const backupData = JSON.parse(content);
                                            Object.keys(localStorage).forEach(key => { if (key.startsWith('vistaran-helpdesk-')) localStorage.removeItem(key); });
                                            for (const key in backupData) {
                                                if (key.startsWith('vistaran-helpdesk-')) {
                                                    const value = backupData[key];
                                                    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                                                }
                                            }
                                            alert("Data Recovery Successful! System will now restart.");
                                            window.location.reload();
                                        }
                                    } catch (error: any) {
                                        alert(`Server recovery failed: ${error.message}`);
                                    }
                                }}
                                buttonClass="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                            />
                        )}
                    </div>
                </div>

                {/* 3. FISCAL YEAR CLOSING */}
                <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white"><i className="fas fa-calendar-check text-xl"></i></div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Fiscal Year-End Protocol</h3>
                            </div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
                                Resets all Invoice, PO, and Challan serials to <span className="text-white">0001</span> for the next financial cycle. <span className="text-rose-400">Archived data will be cleared from browser.</span>
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsYearEndModalOpen(true)}
                            className="bg-white text-slate-900 font-black px-10 py-5 rounded-[22px] hover:bg-primary hover:text-white transition-all active:scale-95 shadow-xl uppercase tracking-widest text-xs flex items-center gap-3 shrink-0"
                        >
                            <i className="fas fa-calendar-minus"></i> Start Reset
                        </button>
                    </div>
                </div>

                {/* 4. SYSTEM MAINTENANCE */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter mb-6">System Maintenance</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SystemActionCard 
                            title="Reset App Branding"
                            description="Restore default logo, app name, and UI themes."
                            buttonText="Reset UI"
                            buttonIcon="fas fa-brush"
                            onClick={handleRestoreSettings}
                            buttonClass="bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                        />
                        <SystemActionCard 
                            title="Factory System Reset"
                            description="Permanently wipes ALL data. Irreversible action."
                            buttonText="Format Data"
                            buttonIcon="fas fa-skull-crossbones"
                            onClick={handleResetData}
                            buttonClass="bg-red-600 hover:bg-red-700 shadow-red-500/20"
                        />
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {isYearEndModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[200] p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[50px] shadow-2xl w-full max-w-md p-12 text-center border border-white/10 animate-in zoom-in-95">
                        <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner">
                            <i className="fas fa-calendar-times"></i>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Confirm Closing?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest leading-loose my-8">
                            Logistics serials will be reset. Ensure you have downloaded a master backup first.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handlePerformYearEnd} className="w-full bg-rose-600 text-white font-black py-6 rounded-3xl shadow-xl hover:bg-rose-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] shadow-rose-500/20">Authorize Closure</button>
                            <button onClick={() => setIsYearEndModalOpen(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Discard</button>
                        </div>
                    </div>
                </div>
            )}

            {modalContent && (
                <ConfirmationModal 
                    title={modalContent.title}
                    body={modalContent.body}
                    onConfirm={modalContent.onConfirm}
                    onClose={() => setModalContent(null)}
                />
            )}
        </>
    );
};

export default SystemSettings;
