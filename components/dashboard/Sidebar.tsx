
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { HomeIcon, TicketIcon, UsersIcon } from '../icons/Icons';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

// In a real app with routing, NavLink would handle active styles.
const NavItem: React.FC<NavItemProps> = ({ to, icon, children, isActive = false }) => (
    <a 
        href={to} 
        className={`flex items-center px-6 py-2 mt-4 text-gray-100 hover:bg-gray-700 hover:bg-opacity-25 ${isActive ? 'bg-gray-700 bg-opacity-25' : ''}`}
    >
        {icon}
        <span className="mx-3">{children}</span>
    </a>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();

  // Since there's no router, the view is fixed per role.
  // We can assume the main dashboard view is always "active".
  const renderNavLinks = () => {
    if (!user) return null;
    
    switch (user.role) {
      case Role.ADMIN:
        return (
          <>
            <NavItem to="#" icon={<HomeIcon className="w-6 h-6" />} isActive={true}>Dashboard</NavItem>
            {/* These are placeholders as there's no routing to other components */}
            <NavItem to="#" icon={<TicketIcon className="w-6 h-6" />}>All Tickets</NavItem>
            <NavItem to="#" icon={<UsersIcon className="w-6 h-6" />}>User Management</NavItem>
          </>
        );
      case Role.USER:
        return (
          <>
            <NavItem to="#" icon={<TicketIcon className="w-6 h-6" />} isActive={true}>My Tickets</NavItem>
          </>
        );
      case Role.TECHNICIAN:
        return (
          <>
            <NavItem to="#" icon={<TicketIcon className="w-6 h-6" />} isActive={true}>Assigned Tickets</NavItem>
          </>
        );
      default:
        return null;
    }
  };

  return (
      <>
        {/* Mobile sidebar overlay */}
        <div 
          className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${isOpen ? 'block' : 'hidden'}`} 
          onClick={toggleSidebar}
        ></div>
        
        {/* Sidebar */}
        <div 
          className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gray-900 text-white transition-transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="flex items-center justify-center px-4 py-6">
                <div className="flex items-center">
                    <TicketIcon className="w-8 h-8 text-primary-500"/>
                    <span className="ml-3 text-2xl font-semibold text-white">Vistaran Desk</span>
                </div>
            </div>
            <nav className="mt-10">
                {renderNavLinks()}
            </nav>
        </div>
      </>
  );
};

export default Sidebar;
