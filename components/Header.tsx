
import React, { useState, useEffect, useRef } from 'react';
import { View, User, Organization } from '../types';
import Icon from './Icon';

interface HeaderProps {
  onNavigate: (view: View) => void;
  currentView: View;
  organizations: Organization[];
  currentOrganizationId: number;
  onSwitchOrganization: (id: number) => void;
  currentUser: User;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView, organizations, currentOrganizationId, onSwitchOrganization, currentUser }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navItems = ['Dashboard', 'Tracks', 'Feed'];
  
  const getActiveStyles = (item: string) => {
    const itemView = (item === 'Feed' ? 'FEED' : item.toUpperCase()) as View;
    if (itemView === 'DASHBOARD' && currentView === 'DASHBOARD') return 'text-primary font-bold border-b-2 border-primary';
    if (item === 'Tracks' && currentView === 'KANBAN') return 'text-primary font-bold border-b-2 border-primary';
    if (itemView === 'USERS' && (currentView === 'USER_DETAIL' || currentView === 'USERS')) return 'text-primary font-bold border-b-2 border-primary';
    if (itemView === currentView) return 'text-primary font-bold border-b-2 border-primary';
    return 'text-gray-600 hover:text-primary border-b-2 border-transparent';
  }

  if (!currentUser) return null;

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center font-bold text-xl text-gray-800 p-2 -ml-2">
              <div className="bg-primary text-white rounded-md px-1.5 py-0.5 text-lg font-bold">Track75</div>
            </div>
            <nav className="hidden lg:flex lg:space-x-4 lg:ml-10 h-full items-center">
              {navItems.map(item => (
                <button 
                    key={item} 
                    onClick={() => onNavigate((item === 'Tracks' ? 'KANBAN' : item === 'Feed' ? 'FEED' : item.toUpperCase()) as View)} 
                    className={`h-full flex items-center transition-colors duration-200 font-medium px-3 ${getActiveStyles(item)}`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center">
            <div className="relative" ref={profileMenuRef}>
              <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100">
                {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="profile" className="w-9 h-9 rounded-full" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold">{currentUser.initials}</div>
                )}
                <span className="hidden sm:inline text-gray-700 font-medium">{currentUser.name}</span>
                <Icon name="chevron-down" className="w-4 h-4 text-gray-500" />
              </button>
              {isProfileMenuOpen && (
                 <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                       <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('USERS'); setIsProfileMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                           <Icon name="profile" className="w-5 h-5 mr-3 text-gray-500"/>
                           User Profile
                       </a>
                       <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('SETTINGS'); setIsProfileMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                           <Icon name="settings" className="w-5 h-5 mr-3 text-gray-500"/>
                           Settings
                       </a>
                        <div className="border-t border-gray-100 my-1"></div>
                       <a href="#" onClick={(e) => { e.preventDefault(); setIsProfileMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">
                           <Icon name="logout" className="w-5 h-5 mr-3"/>
                           Logout
                       </a>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
