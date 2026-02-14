import React, { useState, useEffect, useCallback } from 'react';
import ShieldIcon from '../icons/ShieldIcon';

const AlwaysOpenManager: React.FC = () => {
    const [protectionEnabled, setProtectionEnabled] = useState(true);

    const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
        if (protectionEnabled) {
            e.preventDefault();
            e.returnValue = 'Are you sure you want to leave? Your session is protected.';
        }
    }, [protectionEnabled]);
    
    const showNotification = (message: string) => {
        // A simple alert for now. A toast component would be better in a real app.
        alert(message);
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.ctrlKey && e.altKey) {
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                setProtectionEnabled(prev => {
                    showNotification(`Protection ${!prev ? 'Enabled' : 'Disabled'}.`);
                    return !prev;
                });
            }
            if (e.key === 'q' || e.key === 'Q') {
                 e.preventDefault();
                 setProtectionEnabled(false);
                 showNotification("Protection bypassed. You can now close the tab.");
                 // We can't close the window, but we can disable the lock so the next attempt works.
            }
        }
    }, []);

    useEffect(() => {
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('keydown', handleKeyDown);

        showNotification('"Always Open" protection is active. Press Ctrl+Alt+P to toggle.');

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleBeforeUnload, handleKeyDown]);

    return (
        <div 
            className="fixed left-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-r-lg shadow-lg cursor-pointer transform -translate-x-12 hover:translate-x-0 transition-transform duration-300 z-50 group"
            onClick={() => showNotification(`Protection is currently ${protectionEnabled ? 'ON' : 'OFF'}.\n\nShortcuts:\nCtrl+Alt+P: Toggle Protection\nCtrl+Alt+Q: Bypass Protection`)}
            title="Protection Status"
        >
            <div className="flex items-center space-x-2">
                <ShieldIcon />
                <span className="font-bold uppercase text-xs tracking-wider origin-left transform rotate-90 whitespace-nowrap group-hover:hidden">
                    Protected
                </span>
                <div className="hidden group-hover:block pr-2">
                     <p className="text-sm font-bold">Always Open</p>
                     <p className="text-xs">{protectionEnabled ? 'Active' : 'Inactive'}</p>
                </div>
            </div>
        </div>
    );
};

export default AlwaysOpenManager;
