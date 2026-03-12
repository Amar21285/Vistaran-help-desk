import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Permission } from '../types';

interface BottomNavProps {
    currentView: string;
    setCurrentView: (view: string) => void;
    onQuickTicket: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView, onQuickTicket }) => {
    const { can } = useAuth();
    
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass-header border-t border-white/10 dark:border-slate-800 z-40 pb-safe no-print">
            <div className="flex justify-around items-center h-16 relative px-4">
                {can(Permission.VIEW_DASHBOARD) && (
                    <button 
                        onClick={() => setCurrentView('dashboard')}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 button-pop ${currentView === 'dashboard' ? 'text-primary scale-110' : 'text-slate-400 opacity-60'}`}
                    >
                        <div className={`p-1.5 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-primary/10' : ''}`}>
                            <i className={`fas fa-home ${currentView === 'dashboard' ? 'text-xl' : 'text-lg'}`}></i>
                        </div>
                    </button>
                )}

                {can(Permission.MANAGE_TICKETS) && (
                    <button 
                        onClick={() => setCurrentView('tickets')}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 button-pop ${currentView === 'tickets' ? 'text-primary scale-110' : 'text-slate-400 opacity-60'}`}
                    >
                        <div className={`p-1.5 rounded-xl transition-all ${currentView === 'tickets' ? 'bg-primary/10' : ''}`}>
                            <i className={`fas fa-ticket-alt ${currentView === 'tickets' ? 'text-xl' : 'text-lg'}`}></i>
                        </div>
                    </button>
                )}

                {/* Central Floating Quick Action */}
                {can(Permission.CREATE_TICKETS) && (
                    <div className="relative -top-7">
                        <button 
                            onClick={onQuickTicket}
                            className="bg-primary text-white w-16 h-16 rounded-[22px] shadow-2xl shadow-primary/40 flex items-center justify-center transform active:scale-90 transition-all border-4 border-slate-50 dark:border-slate-900 hover-glow"
                        >
                            <i className="fas fa-plus text-2xl"></i>
                        </button>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full blur-[1px] opacity-50"></div>
                    </div>
                )}

                {(can(Permission.VIEW_INVENTORY) || can(Permission.MANAGE_INVENTORY)) && (
                    <button 
                        onClick={() => setCurrentView('inventory')}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 button-pop ${currentView === 'inventory' ? 'text-primary scale-110' : 'text-slate-400 opacity-60'}`}
                    >
                        <div className={`p-1.5 rounded-xl transition-all ${currentView === 'inventory' ? 'bg-primary/10' : ''}`}>
                            <i className={`fas fa-box-open ${currentView === 'inventory' ? 'text-xl' : 'text-lg'}`}></i>
                        </div>
                    </button>
                )}

                <button 
                    onClick={() => setCurrentView('my-profile')}
                    className={`flex flex-col items-center gap-1.5 transition-all duration-300 button-pop ${currentView === 'my-profile' ? 'text-primary scale-110' : 'text-slate-400 opacity-60'}`}
                >
                    <div className={`p-1.5 rounded-xl transition-all ${currentView === 'my-profile' ? 'bg-primary/10' : ''}`}>
                        <i className={`fas fa-user ${currentView === 'my-profile' ? 'text-xl' : 'text-lg'}`}></i>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default BottomNav;