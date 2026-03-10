import React, { useState, useRef, useEffect } from 'react';
import { User, AppNotification } from '../types';
import Logo from './icons/Logo';
import { useSettings } from '../hooks/useSettings';

interface TopNavProps {
    user: User;
    onLogout: () => void;
    globalFilter: string;
    setGlobalFilter: (filter: string) => void;
    onScanClick?: () => void;
    isImpersonating?: boolean;
    stopImpersonation?: () => void;
    onViewProfile: () => void;
    onToggleSidebar: () => void;
    notifications?: AppNotification[];
    setNotifications?: (notifs: AppNotification[]) => void;
    isSyncConnected?: boolean;
}

const TopNav: React.FC<TopNavProps> = ({
    user, onLogout, globalFilter, setGlobalFilter, onScanClick,
    isImpersonating, stopImpersonation, onViewProfile, onToggleSidebar,
    notifications = [], setNotifications, isSyncConnected = false
}) => {
    const { appName, logoUrl, notificationSettings } = useSettings();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevFilterRef = useRef(globalFilter);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (globalFilter !== prevFilterRef.current && globalFilter.length > 0) {
            setIsPulsing(true);
            const timer = setTimeout(() => setIsPulsing(false), 1000);
            if (document.activeElement === inputRef.current) {
                inputRef.current?.blur();
            }
            return () => clearTimeout(timer);
        }
        prevFilterRef.current = globalFilter;
    }, [globalFilter]);

    const handleDropdownClick = (action: () => void) => {
        action();
        setDropdownOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            inputRef.current?.blur();
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAllRead = () => {
        if (setNotifications) {
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        }
    };

    const markRead = (id: string) => {
        if (setNotifications) {
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        }
    };

    return (
        <header className="bg-white dark:bg-slate-800 shadow-sm z-20 shrink-0 no-print safe-top">
            {isImpersonating && (
                <div className="bg-yellow-400 text-black text-center p-2 font-semibold flex justify-center items-center gap-4 animate-in slide-in-from-top duration-300">
                    <i className="fas fa-user-secret"></i>
                    <span className="text-xs">Impersonating <strong>{user.name}</strong></span>
                    <button onClick={stopImpersonation} className="bg-black text-white text-[10px] font-bold py-1 px-3 rounded-full">Stop</button>
                </div>
            )}
            <div className="px-4 py-2 flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                    <button className="p-2 text-slate-500 rounded-md md:hidden hover:bg-slate-100 dark:hover:bg-slate-700 transition" onClick={onToggleSidebar}>
                        <i className="fas fa-bars text-lg"></i>
                    </button>
                    {logoUrl ? (
                        <img src={logoUrl} className="h-7 w-auto object-contain" alt="Logo" />
                    ) : (
                        <Logo className="h-7" />
                    )}
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200 hidden sm:block uppercase tracking-tighter">
                        {appName}
                    </span>
                </div>

                <div className="flex-1 flex justify-center px-4 max-w-lg hidden md:flex">
                    <div className={`relative w-full group transition-all duration-300 ${isPulsing ? 'scale-[1.02]' : ''}`}>
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i className={`fas fa-search transition-colors ${isPulsing ? 'text-primary' : 'text-gray-400 group-focus-within:text-primary'}`}></i>
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search fleet..."
                            className={`w-full bg-slate-100 dark:bg-slate-700 border rounded-2xl py-2 pl-11 pr-24 focus:outline-none focus:ring-4 transition-all text-xs font-medium shadow-inner ${isPulsing
                                ? 'border-primary ring-primary/20 bg-white dark:bg-slate-600'
                                : 'border-slate-200 dark:border-slate-600 focus:ring-primary/10 focus:border-primary placeholder-slate-400 dark:placeholder-slate-500'
                                }`}
                        />
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                            {globalFilter && (
                                <button onClick={() => setGlobalFilter('')} className="p-2 text-slate-400 hover:text-red-500"><i className="fas fa-times-circle"></i></button>
                            )}
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 mx-1"></div>
                            <button onClick={onScanClick} className="p-2.5 text-slate-400 hover:text-primary"><i className="fas fa-camera text-base"></i></button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-4">
                    <button onClick={onScanClick} className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 active:bg-slate-100">
                        <i className="fas fa-camera text-lg"></i>
                    </button>

                    <div className="flex items-center justify-center gap-1 min-w-[32px] sm:min-w-[40px] px-1 sm:px-2">
                        <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isSyncConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'} transition-all duration-500`}></div>
                        <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-tighter mt-0.5 text-slate-400">Live</span>
                    </div>

                    {notificationSettings.enableInAppNotifications && (
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setNotifOpen(!notifOpen)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative ${notifOpen ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                <i className="fas fa-bell text-lg"></i>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-20 border dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <header className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700 flex justify-between items-center">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alert Center</h4>
                                        <button onClick={markAllRead} className="text-[10px] font-black text-primary uppercase">Clear All</button>
                                    </header>
                                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                        {notifications.length > 0 ? notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => markRead(notif.id)}
                                                className={`p-4 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${notif.type === 'ticket' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    <i className={`fas ${notif.type === 'ticket' ? 'fa-ticket-alt' : 'fa-info-circle'} text-xs`}></i>
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className={`text-[11px] font-black uppercase tracking-tight text-slate-800 dark:text-white ${!notif.isRead ? 'font-bold' : ''}`}>{notif.title}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{notif.message}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="p-8 text-center text-slate-400 opacity-50">
                                                <p className="text-[10px] font-black uppercase tracking-widest">No alerts</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative" ref={dropdownRef}>
                        <div className="cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)}>
                            <img
                                src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                alt="Profile"
                                className="w-8 h-8 rounded-full object-cover border-2 border-slate-100 dark:border-slate-600"
                            />
                        </div>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl py-2 z-20 border dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                                <button onClick={() => handleDropdownClick(onViewProfile)} className="w-full text-left flex items-center space-x-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <i className="fas fa-user-circle"></i>
                                    <span>Profile</span>
                                </button>
                                <button onClick={() => handleDropdownClick(onLogout)} className="w-full text-left flex items-center space-x-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50">
                                    <i className="fas fa-sign-out-alt"></i>
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNav;