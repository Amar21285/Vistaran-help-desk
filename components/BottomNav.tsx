import React from 'react';

interface BottomNavProps {
    currentView: string;
    setCurrentView: (view: string) => void;
    onQuickTicket: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView, onQuickTicket }) => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-40 pb-safe">
            <div className="flex justify-around items-center h-16 relative">
                <button 
                    onClick={() => setCurrentView('dashboard')}
                    className={`flex flex-col items-center gap-1 transition-all ${currentView === 'dashboard' ? 'text-primary' : 'text-slate-400'}`}
                >
                    <i className="fas fa-home text-lg"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
                </button>

                <button 
                    onClick={() => setCurrentView('tickets')}
                    className={`flex flex-col items-center gap-1 transition-all ${currentView === 'tickets' ? 'text-primary' : 'text-slate-400'}`}
                >
                    <i className="fas fa-ticket-alt text-lg"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Tickets</span>
                </button>

                {/* Central Floating Quick Action */}
                <div className="relative -top-6">
                    <button 
                        onClick={onQuickTicket}
                        className="bg-primary text-white w-14 h-14 rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center transform active:scale-90 transition-all border-4 border-slate-100 dark:border-slate-900"
                    >
                        <i className="fas fa-bolt text-xl"></i>
                    </button>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase text-primary whitespace-nowrap tracking-widest">Quick Raise</span>
                </div>

                <button 
                    onClick={() => setCurrentView('inventory')}
                    className={`flex flex-col items-center gap-1 transition-all ${currentView === 'inventory' ? 'text-primary' : 'text-slate-400'}`}
                >
                    <i className="fas fa-box text-lg"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Assets</span>
                </button>

                <button 
                    onClick={() => setCurrentView('my-profile')}
                    className={`flex flex-col items-center gap-1 transition-all ${currentView === 'my-profile' ? 'text-primary' : 'text-slate-400'}`}
                >
                    <i className="fas fa-user-circle text-lg"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
                </button>
            </div>
            <div className="h-[env(safe-area-inset-bottom)] bg-transparent"></div>
        </div>
    );
};

export default BottomNav;