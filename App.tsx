
import React, { useState, useEffect, useMemo } from 'react';
import { View, User, UserRole, Organization, OrganizationStatus } from './types';
import Notification from './components/Notification';
import UserDetailPage from './components/UserDetailPage';
import DashboardPage from './components/DashboardPage';
import Header from './components/Header';
import KanbanPage from './components/KanbanPage';
import OrganizationsDashboard from './components/OrganizationsDashboard';
import ClientsDashboard from './components/ClientsDashboard';
import ClientDetailPage from './components/ClientDetailPage';
import LoginPage from './components/LoginPage';
import TrackFeedsPage from './components/TrackFeedsPage';
import GlobalFeedPage from './components/GlobalFeedPage';
import Icon from './components/Icon';

// API imports
import { getOrganizations } from './api/organizationsApi';
import { getCurrentUser } from './api/authApi';
import { getAuthToken, clearAuthToken } from './api/client';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // We still fetch organizations globally for the header switcher to work across pages
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<number>(1);
  
  const [notification, setNotification] = useState('');

  // Check for existing token and load user
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthLoading(true);
      getCurrentUser()
        .then(user => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          if (user.organizationId) {
            setCurrentOrganizationId(user.organizationId);
          }
          // Wrap setOrganizations in an arrow function to prevents React Error #310
          // caused by implicit argument passing if getOrganizations resolves with multiple args or similar issues.
          return getOrganizations();
        })
        .then(data => setOrganizations(data))
        .catch(error => {
          console.error("Auth initialization failed:", error);
          clearAuthToken();
          setIsAuthenticated(false);
        })
        .finally(() => {
          setIsAuthLoading(false);
        });
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  const isSuperAdmin = useMemo(() => currentUser?.role === UserRole.SUPER_ADMIN, [currentUser]);
  const currentOrganization = useMemo(() => organizations.find(org => org.id === currentOrganizationId), [organizations, currentOrganizationId]);
  const isOrganizationDeactivated = useMemo(() => currentOrganization?.status === OrganizationStatus.DEACTIVATED, [currentOrganization]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  const handleNavigate = (view: View, id?: number) => {
    setCurrentView(view);
    if (id !== undefined) setSelectedId(id);
    else setSelectedId(null);
  };
  
  const handleSwitchOrganization = (id: number) => {
    setCurrentOrganizationId(id);
    handleNavigate('DASHBOARD');
  };

  const handleLogin = async (email: string, password?: string) => {
    try {
      setIsAuthLoading(true);
      const { login } = await import('./api/authApi');
      const { user } = await login({ email, password });
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (user.organizationId) {
        setCurrentOrganizationId(user.organizationId);
      }
      const orgs = await getOrganizations();
      setOrganizations(orgs);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} isLoading={isAuthLoading} error={authError} />;
  }

  if (!currentUser) return null;

  const renderContent = () => {
    if (isOrganizationDeactivated && !isSuperAdmin) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-200px)]">
          <Icon name="bug-issue" className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">This organization has been deactivated.</h1>
          <p className="text-gray-600 mt-2">Please contact your Super Admin for assistance.</p>
        </div>
      );
    }

    switch (currentView) {
      case 'DASHBOARD':
        return <DashboardPage
                  currentUser={currentUser}
                  onNavigate={handleNavigate}
                />;
      case 'KANBAN':
        return <KanbanPage
                  currentUser={currentUser}
                  onNavigate={handleNavigate}
                />;
      case 'TRACKS':
      case 'TRACK_DETAIL':
        if (!selectedId) return <KanbanPage currentUser={currentUser} onNavigate={handleNavigate} />;
        return <TrackFeedsPage 
            trackId={selectedId} 
            currentUser={currentUser}
            onNavigate={handleNavigate}
        />;
      
      case 'ORGANIZATIONS':
          return <OrganizationsDashboard
              currentUser={currentUser}
              onNavigate={handleNavigate}
          />;
      case 'CLIENTS':
          return <ClientsDashboard
              onNavigate={handleNavigate}
          />
      case 'CLIENT_DETAIL':
          if (!selectedId) return <ClientsDashboard onNavigate={handleNavigate} />;
          return <ClientDetailPage
              clientId={selectedId}
              onNavigate={handleNavigate}
              currentUser={currentUser}
          />
      case 'USERS':
      case 'USER_DETAIL':
        if (!selectedId) {
             return <UserDetailPage 
                currentUser={currentUser}
                onNavigate={handleNavigate}
             />
        }
        return <UserDetailPage 
            userId={selectedId}
            currentUser={currentUser}
            onNavigate={handleNavigate}
        />;
      
      case 'SETTINGS':
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="mt-4 text-gray-600">Settings configuration coming soon.</p>
            </div>
        );
      
      case 'FEED':
      default:
        return <GlobalFeedPage 
            currentUser={currentUser}
            onNavigate={handleNavigate}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-light">
      <Header
        onNavigate={handleNavigate}
        currentView={currentView}
        organizations={organizations}
        currentOrganizationId={currentOrganizationId}
        onSwitchOrganization={handleSwitchOrganization}
        currentUser={currentUser}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          {notification && <Notification message={notification} />}
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
