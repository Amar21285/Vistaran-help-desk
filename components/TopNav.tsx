import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import Logo from './icons/Logo';

interface TopNavProps {
    user: User | null;
    onLogout: () => void;
    globalFilter: string;
    setGlobalFilter: (filter: string) => void;
    isImpersonating?: boolean;
    stopImpersonation?: () => void;
    onViewProfile: () => void;
    onToggleSidebar: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ user, onLogout, globalFilter, setGlobalFilter, isImpersonating, stopImpersonation, onViewProfile, onToggleSidebar }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDropdownClick = (action: () => void) => {
        action();
        setDropdownOpen(false);
    };

    // Handle case where user is null
    if (!user) {
        return (
            <header className="bg-white dark:bg-slate-800 shadow-md z-20 shrink-0 no-print">
                <div className="p-3 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <button className="p-1 text-slate-500 rounded-md md:hidden" onClick={onToggleSidebar} aria-label="Open sidebar">
                            <i className="fas fa-bars text-xl"></i>
                        </button>
                        <Logo className="h-9" />
                        <span className="text-xl font-semibold text-slate-700 dark:text-slate-200 hidden md:block">Vistaran Help Desk</span>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="bg-white dark:bg-slate-800 shadow-md z-20 shrink-0 no-print">
            {isImpersonating && (
                <div className="bg-yellow-400 text-black text-center p-2 font-semibold flex justify-center items-center gap-4">
                    <i className="fas fa-user-secret"></i>
                    <span>You are impersonating <strong>{user.name}</strong>.</span>
                    <button onClick={stopImpersonation} className="bg-black text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-gray-700">
                        Stop Impersonating
                    </button>
                </div>
            )}
            <div className="p-3 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <button className="p-1 text-slate-500 rounded-md md:hidden" onClick={onToggleSidebar} aria-label="Open sidebar">
                        <i className="fas fa-bars text-xl"></i>
                    </button>
                    <Logo className="h-9" />
                    <span className="text-xl font-semibold text-slate-700 dark:text-slate-200 hidden md:block">Vistaran Help Desk</span>
                </div>

                <div className="flex-1 flex justify-center px-4">
                    <div className="relative w-full max-w-lg">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fas fa-search text-gray-400"></i>
                        </div>
                        <input
                            type="text"
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Search tickets, users, files..."
                            className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
                        />
                    </div>
                </div>

                <div className="relative" ref={dropdownRef}>
                    <div 
                        className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        onClick={() => setDropdownOpen(prev => !prev)}
                        role="button"
                        aria-haspopup="true"
                        aria-expanded={dropdownOpen}
                    >
                        <img 
                            src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                            alt="Profile" 
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                        />
                        <div className="hidden sm:block">
                            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span>{user.name}</span>
                                <span className="relative flex h-2.5 w-2.5" title="Real-time sync active across tabs">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{user.role}</div>
                        </div>
                        <i className={`fas fa-chevron-down text-slate-500 ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}></i>
                    </div>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-20 ring-1 ring-black dark:ring-slate-600 ring-opacity-5">
                            <button
                                onClick={() => handleDropdownClick(onViewProfile)}
                                className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <i className="fas fa-user-circle w-5 text-center text-slate-500 dark:text-slate-400"></i>
                                <span>View Profile</span>
                            </button>
                            <div className="border-t my-1 border-slate-200 dark:border-slate-700"></div>
                            <button
                                onClick={() => handleDropdownClick(onLogout)}
                                className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700"
                            >
                                <i className="fas fa-sign-out-alt w-5 text-center"></i>
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopNav;