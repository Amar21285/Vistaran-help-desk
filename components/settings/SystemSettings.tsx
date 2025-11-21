import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';

const SystemActionCard: React.FC<{ title: string; description: string; buttonText: string; buttonIcon: string; onClick: () => void; buttonClass?: string; }> = ({ title, description, buttonText, buttonIcon, onClick, buttonClass = 'bg-blue-600 hover:bg-blue-700' }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-grow">
            <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
        <button
            onClick={onClick}
            className={`w-full md:w-auto text-white font-semibold px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 ${buttonClass}`}
        >
            <i className={buttonIcon}></i>
            {buttonText}
        </button>
    </div>
);

const ConfirmationModal: React.FC<{ title: string; body: string; onConfirm: () => void; onClose: () => void; }> = ({ title, body, onConfirm, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center modal-content">
            <div className="text-amber-500 mb-4">
                <i className="fas fa-exclamation-triangle fa-3x"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            <p className="text-slate-600 dark:text-slate-300 my-4">{body}</p>
            <div className="flex justify-center gap-4 mt-6">
                <button
                    onClick={onClose}
                    className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-6 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="bg-amber-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-amber-700 transition"
                >
                    Confirm
                </button>
            </div>
        </div>
    </div>
);


const SystemSettings: React.FC = () => {
    const { resetSettings } = useSettings();
    const { resetTheme } = useTheme();
    const [modalContent, setModalContent] = useState<{ title: string; body: string; onConfirm: () => void; } | null>(null);

    const handleCreateBackup = async () => {
        try {
            const backupData: { [key: string]: any } = {};
            const keysToBackup = Object.keys(localStorage).filter(key => key.startsWith('vistaran-helpdesk-'));
    
            keysToBackup.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    try {
                        backupData[key] = JSON.parse(item);
                    } catch (e) {
                        backupData[key] = item;
                    }
                }
            });
            
            if (Object.keys(backupData).length === 0) {
                alert("No data found to backup.");
                return;
            }
    
            const backupJSON = JSON.stringify(backupData, null, 2);
            const blob = new Blob([backupJSON], { type: 'application/json' });
            const date = new Date().toISOString().split('T')[0];
            const fileName = `vistaran-helpdesk-backup-${date}.json`;
    
            // Use the fallback download method which is universally supported and avoids cross-origin iframe errors.
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert(`Backup successful! Check your downloads for ${fileName}.`);

        } catch (err) {
            console.error('Backup failed:', err);
            alert('An error occurred during the backup process.');
        }
    };

    const handleRestoreBackup = () => {
        const applyRestore = (jsonString: string) => {
            try {
                const backupData = JSON.parse(jsonString);
    
                if (typeof backupData !== 'object' || !backupData['vistaran-helpdesk-users']) {
                    throw new Error('Invalid backup file format.');
                }
    
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('vistaran-helpdesk-')) {
                        localStorage.removeItem(key);
                    }
                });
    
                for (const key in backupData) {
                    if (Object.prototype.hasOwnProperty.call(backupData, key) && key.startsWith('vistaran-helpdesk-')) {
                        const value = backupData[key];
                        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                    }
                }
    
                alert("Restore successful! The application will now reload to apply the changes.");
                window.location.reload();
    
            } catch (error: any) {
                console.error("Restore failed:", error);
                alert(`Restore failed. Please ensure you have selected a valid backup file. Error: ${error.message}`);
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
                if (content) {
                    if (confirm("Are you sure you want to restore from this backup? This will overwrite all existing data.")) {
                        applyRestore(content);
                    }
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };


    const handleRestoreSettings = () => {
        setModalContent({
            title: "Reset Application Settings",
            body: "Are you sure you want to reset all theme, logo, and notification settings to their defaults? This action cannot be undone.",
            onConfirm: () => {
                resetTheme();
                resetSettings();
                setModalContent(null);
            }
        });
    };
    
    const handleResetData = () => {
         setModalContent({
            title: "Reset All Application Data",
            body: "Are you sure? This will permanently delete all tickets, users, and files created during this session and restore the original demo data. This action is irreversible.",
            onConfirm: () => {
                // Clear all data from localStorage
                localStorage.removeItem('vistaran-helpdesk-tickets');
                localStorage.removeItem('vistaran-helpdesk-users');
                localStorage.removeItem('vistaran-helpdesk-technicians');
                localStorage.removeItem('vistaran-helpdesk-files');
                localStorage.removeItem('vistaran-helpdesk-symptoms');
                localStorage.removeItem('vistaran-helpdesk-templates');
                localStorage.removeItem('vistaran-helpdesk-departments');

                // Close modal and reload to apply changes
                setModalContent(null);
                alert("All application data has been reset. The application will now reload.");
                window.location.reload();
            }
        });
    };

    return (
        <>
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Backup & Restore</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Create backups of your application data or restore from a previous backup.
                    </p>
                    <div className="mt-6 space-y-4">
                        <SystemActionCard 
                            title="Create Backup"
                            description="Generate a full backup of all application data. The file will be saved to your default downloads folder."
                            buttonText="Create Backup"
                            buttonIcon="fas fa-download"
                            onClick={handleCreateBackup}
                        />
                        <SystemActionCard 
                            title="Restore from Backup"
                            description="Restore the application state from a backup file. This will overwrite all current data. This action is irreversible."
                            buttonText="Restore from Backup"
                            buttonIcon="fas fa-upload"
                            onClick={handleRestoreBackup}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Restore to Defaults</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Revert application data and settings to their original, out-of-the-box state.
                    </p>
                     <div className="mt-6 space-y-4">
                        <SystemActionCard 
                            title="Reset Application Settings"
                            description="Resets theme, logo, and notification preferences to their default values."
                            buttonText="Reset Settings"
                            buttonIcon="fas fa-undo-alt"
                            onClick={handleRestoreSettings}
                            buttonClass="bg-amber-600 hover:bg-amber-700"
                        />
                        <SystemActionCard 
                            title="Reset All Application Data"
                            description="Deletes all created tickets, users, files, etc., and restores the original demo data. The page will reload."
                            buttonText="Reset Data"
                            buttonIcon="fas fa-database"
                            onClick={handleResetData}
                            buttonClass="bg-red-600 hover:bg-red-700"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">System Information</h3>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-md">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">App Version:</span> 1.0.0
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-md">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Database Status:</span> <span id="database-status">Connected (MySQL)</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-md">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Email Service:</span> Configured & Ready
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-md">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Gemini API:</span> Active
                        </div>
                    </div>
                </div>
            </div>

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