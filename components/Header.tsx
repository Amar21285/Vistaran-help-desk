import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import LogoutIcon from './icons/LogoutIcon';
import ProfileModal from './ProfileModal';
import { User } from '../types';
import UserCircleIcon from './icons/UserCircleIcon';

interface HeaderProps {
    onCurrentUserUpdate: (user: User) => void;
}

const Header: React.FC<HeaderProps> = ({ onCurrentUserUpdate }) => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown if clicked outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);


    if (!user) return null;
    
    const handleProfileSave = (updatedUser: User) => {
        onCurrentUserUpdate(updatedUser);
        setIsProfileModalOpen(false);
    };

    const handleEditProfileClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsProfileModalOpen(true);
        setDropdownOpen(false);
    };
    
    const handleLogoutClick = (e: React.MouseEvent) => {
        e.preventDefault();
        logout();
        setDropdownOpen(false);
    };

    return (
        <>
            <header className="bg-white shadow-md p-4 flex justify-between items-center z-10">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Welcome, {user.name}</h1>
                    <p className="text-sm text-slate-500">{user.role} - {user.department} Department</p>
                </div>
                <div className="flex items-center space-x-4" ref={dropdownRef}>
                     <div className="relative">
                        <img 
                            src={user.photo} 
                            alt={user.name} 
                            className="w-12 h-12 rounded-full border-2 border-primary object-cover cursor-pointer"
                            onClick={() => setDropdownOpen(prev => !prev)}
                        />
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5">
                                <a 
                                    href="#" 
                                    onClick={handleEditProfileClick}
                                    className="flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    <UserCircleIcon className="text-slate-500"/>
                                    <span>Edit Profile</span>
                                </a>
                                <a 
                                    href="#" 
                                    onClick={handleLogoutClick}
                                    className="flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    <LogoutIcon />
                                    <span>Logout</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            {isProfileModalOpen && (
                <ProfileModal
                    user={user}
                    onClose={() => setIsProfileModalOpen(false)}
                    onSave={handleProfileSave}
                />
            )}
        </>
    );
};

export default Header;