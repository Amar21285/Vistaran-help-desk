import React, { useEffect, useState } from 'react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt. Clear it up
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="mobile-modal fixed bottom-4 right-4 z-[9999] bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 border border-slate-200 dark:border-slate-700 max-w-sm w-full flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
        <i className="fa-solid fa-download text-blue-600 dark:text-blue-400 text-xl"></i>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-900 dark:text-white">Install Vistaran</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Get the native app experience for your device.</p>
        <div className="mt-3 flex gap-2">
          <button 
            onClick={handleInstallClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Install
          </button>
          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
