import React, { useState, useEffect, useRef } from 'react';
import { View, User, Organization, Notification } from '../types';
import { getNotifications } from '../api/notificationsApi';
import NotificationCenter from './NotificationCenter';
import Icon from './Icon';

interface HeaderProps {
  onNavigate: (view: View) => void;
  currentView: View;
  organizations: Organization[];
  currentOrganizationId: number;
  onSwitchOrganization: (id: number) => void;
  currentUser: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView, organizations, currentOrganizationId, onSwitchOrganization, currentUser, onLogout }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Notification State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (currentUser) {
      const data = await getNotifications(currentUser.id);
      setNotifications(data);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

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
    return 'text-gray-600 dark:text-dark-text hover:text-primary border-b-2 border-transparent';
  }

  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 dark:bg-dark-bg/90 dark:border-dark-elevated sticky top-0 z-30 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center font-bold text-xl text-gray-800 dark:text-dark-text p-2 -ml-2 cursor-pointer" onClick={() => onNavigate('DASHBOARD')}>
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
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors"
            >
              <Icon name="bell" className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-dark-bg"></span>
              )}
            </button>

            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="profile" className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold">{currentUser.initials}</div>
                )}
                <span className="hidden sm:inline text-gray-700 dark:text-dark-text font-medium">{currentUser.name}</span>
                <Icon name="chevron-down" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              {isProfileMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-dark-popup ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('USERS'); setIsProfileMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-elevated" role="menuitem">
                      <Icon name="profile" className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                      User Profile
                    </a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('SETTINGS'); setIsProfileMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-elevated" role="menuitem">
                      <Icon name="settings" className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                      Settings
                    </a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('BILLING'); setIsProfileMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-elevated" role="menuitem">
                      <Icon name="credit-card" className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                      Billing
                    </a>
                    <div className="border-t border-gray-100 dark:border-dark-elevated my-1"></div>
                    <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setIsProfileMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10" role="menuitem">
                      <Icon name="logout" className="w-5 h-5 mr-3" />
                      Logout
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Center (Portal-like, absolute to header) */}
      <NotificationCenter
        userId={currentUser.id}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onNotificationsUpdate={fetchNotifications}
      />
    </header>
  );
};

export default Header;
