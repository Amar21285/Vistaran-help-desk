import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bars3Icon, BellIcon, PowerIcon, UserCircleIcon } from '../icons/Icons';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b-4 border-primary-600">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none md:hidden">
          <Bars3Icon className="w-6 h-6" />
        </button>
        <div className="relative mx-4 lg:mx-0">
          <h1 className="text-lg font-semibold text-gray-700">Vistaran Help Desk</h1>
        </div>
      </div>

      <div className="flex items-center">
        <button className="flex mx-4 text-gray-600 focus:outline-none">
          <BellIcon className="w-6 h-6" />
        </button>

        <div className="relative">
          <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="relative z-10 block w-8 h-8 overflow-hidden rounded-full shadow focus:outline-none">
            <img className="object-cover w-full h-full" src={user?.photo} alt={user?.name} />
          </button>

          {isDropdownOpen && (
            <>
              <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-10 w-full h-full"></div>
              <div className="absolute right-0 z-20 w-48 py-2 mt-2 bg-white rounded-md shadow-xl">
                <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-600 hover:text-white">
                  <UserCircleIcon className="w-5 h-5 mr-2" />
                  <span>Profile</span>
                </a>
                <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-primary-600 hover:text-white">
                    <PowerIcon className="w-5 h-5 mr-2" />
                    <span>Log out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
