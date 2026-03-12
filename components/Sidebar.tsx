import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role, Permission } from '../types';
import { DashboardIcon, TicketIcon, PlusCircleIcon, UsersIcon, FolderOpenIcon, CogsIcon, ChartBarIcon, UserTagIcon, HelpIcon, BoxIcon } from './icons/FontAwesome';

interface SidebarProps {
    currentView: string;
    setCurrentView: (view: string) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
    <li
        onClick={onClick}
        className={`flex items-center space-x-3 p-3.5 my-1.5 rounded-2xl cursor-pointer transition-all duration-300 group ${
            isActive
                ? 'bg-primary text-white shadow-xl shadow-primary/25 scale-[1.02] border border-white/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700/50 hover:text-primary dark:hover:text-white hover:shadow-soft'
        }`}
    >
        <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </div>
        <span className={`text-[13px] font-black uppercase tracking-tight transition-all ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
            {label}
        </span>
    </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
    const { user, realUser, can } = useAuth();
    if (!user) return null;
    
    const isAdmin = realUser?.role === Role.ADMIN;
    
    const handleNavigation = (view: string) => {
        setCurrentView(view);
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    };

    return (
        <aside className={`w-72 glass-morphism shadow-2xl flex-shrink-0 p-6 flex flex-col no-print fixed inset-y-0 left-0 z-50 transform transition-all duration-500 ease-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="mb-10 px-2 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                    <i className="fas fa-v text-xl font-black"></i>
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">Vistaran</h1>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Help Desk</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                <ul className="space-y-1">
                    {can(Permission.VIEW_DASHBOARD) && (
                        <NavItem
                            icon={<DashboardIcon />}
                            label="Dashboard Hub"
                            isActive={currentView === 'dashboard'}
                            onClick={() => handleNavigation('dashboard')}
                        />
                    )}
                    {can(Permission.MANAGE_TICKETS) && (
                        <NavItem
                            icon={<TicketIcon />}
                            label={isAdmin ? "Ticket Control" : "My Support Tickets"}
                            isActive={currentView === 'tickets'}
                            onClick={() => handleNavigation('tickets')}
                        />
                    )}
                    {can(Permission.CREATE_TICKETS) && (
                        <NavItem
                            icon={<PlusCircleIcon />}
                            label="Raise New Ticket"
                            isActive={currentView === 'create-ticket'}
                            onClick={() => handleNavigation('create-ticket')}
                        />
                    )}
                    {can(Permission.VIEW_ASSIGNED_TICKETS) && (
                        <NavItem
                            icon={<UserTagIcon />}
                            label="Assigned Duties"
                            isActive={currentView === 'assigned-tickets'}
                            onClick={() => handleNavigation('assigned-tickets')}
                        />
                    )}
                    {can(Permission.MARK_ATTENDANCE) && !isAdmin && (
                        <NavItem
                            icon={<i className="fas fa-clock-rotate-left w-6 text-center"></i>}
                            label="Attendance Registry"
                            isActive={currentView === 'attendance'}
                            onClick={() => handleNavigation('attendance')}
                        />
                    )}
                    {(can(Permission.MANAGE_INVENTORY) || can(Permission.VIEW_INVENTORY)) && (
                        <NavItem
                            icon={<BoxIcon />}
                            label="Asset Inventory"
                            isActive={currentView === 'inventory'}
                            onClick={() => handleNavigation('inventory')}
                        />
                    )}
                    {can(Permission.VIEW_REPORTS) && (
                        <NavItem
                            icon={<ChartBarIcon />}
                            label="Analytics Center"
                            isActive={currentView === 'reports'}
                            onClick={() => handleNavigation('reports')}
                        />
                    )}
                    {can(Permission.ACCESS_FILE_MANAGER) && (
                        <NavItem
                            icon={<FolderOpenIcon />}
                            label="Cloud Repository"
                            isActive={currentView === 'file-manager'}
                            onClick={() => handleNavigation('file-manager')}
                        />
                    )}
                    
                    <NavItem
                        icon={<HelpIcon />}
                        label="Knowledge Base"
                        isActive={currentView === 'help-center'}
                        onClick={() => handleNavigation('help-center')}
                    />

                    {isAdmin && (
                        <>
                            <div className="pt-6 pb-2 px-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Admin Command</span>
                            </div>
                            {can(Permission.MANAGE_USERS) && (
                                <NavItem
                                    icon={<UsersIcon />}
                                    label="Personnel Control"
                                    isActive={currentView === 'users'}
                                    onClick={() => handleNavigation('users')}
                                />
                            )}
                            {can(Permission.MANAGE_SETTINGS) && (
                                <NavItem
                                    icon={<CogsIcon />}
                                    label="System Core"
                                    isActive={currentView === 'app-settings'}
                                    onClick={() => handleNavigation('app-settings')}
                                />
                            )}
                        </>
                    )}
                </ul>
            </nav>
            <div className="mt-auto p-4 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-white/10 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engineered by</p>
                <p className="text-[11px] font-black text-primary uppercase mt-1">Amarjeet Yadav</p>
                <p className="text-[9px] text-slate-500 mt-2 font-bold italic">&copy; 2024 Vistaran Inc.</p>
            </div>
        </aside>
    );
};

export default Sidebar;