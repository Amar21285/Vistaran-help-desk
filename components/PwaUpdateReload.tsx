import React from 'react';
// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PwaUpdateReload: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="mobile-modal fixed bottom-4 left-4 z-[9999] bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 border border-slate-200 dark:border-slate-700 max-w-sm w-full">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
          <i className={`fa-solid ${offlineReady ? 'fa-check' : 'fa-cloud-arrow-down'} text-green-600 dark:text-green-400 text-xl`}></i>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white">
            {offlineReady ? 'App ready to work offline' : 'New Update Available'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {offlineReady
              ? 'You can now use Vistaran Help Desk without an internet connection.'
              : 'A new version of Vistaran is available. Update to get the latest features.'}
          </p>
          <div className="mt-3 flex gap-2">
            {needRefresh && (
              <button 
                onClick={() => updateServiceWorker(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Reload
              </button>
            )}
            <button 
              onClick={close}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
