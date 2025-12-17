import React, { useState, useEffect, useMemo } from 'react';
import { View, User, UserRole, Organization, OrganizationStatus } from './types';
import Notification from './components/Notification';
import UserDetailPage from './components/UserDetailPage';
import DashboardPage from './components/DashboardPage';
import AccountSettingsPage from './components/AccountSettingsPage';
import Header from './components/Header';
import KanbanPage from './components/KanbanPage';
import OrganizationsDashboard from './components/OrganizationsDashboard';

import LoginPage from './components/LoginPage';
import TrackFeedsPage from './components/TrackFeedsPage';
import GlobalFeedPage from './components/GlobalFeedPage';
import { ToastProvider } from './components/ToastContext';
import Icon from './components/Icon';
import SettingsPage from './components/SettingsPage';
import BillingPage from './components/BillingPage';
import { applyTheme, applyDarkMode } from './utils/themeUtils';



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

  const fetchOrganizations = async () => {
    try {
      const data = await getOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error("Failed to fetch organizations", error);
    }
  };

  // Check for existing token and load user
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthLoading(true);
      getCurrentUser()
        .then(async (user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);

          // Apply Theme Mode
          if (user.themePreference) {
            applyDarkMode(user.themePreference === 'dark');
          }

          return fetchOrganizations();
        })
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

  // Apply Organization Branding
  useEffect(() => {
    if (currentOrganization) {
      if (currentOrganization.useBranding && currentOrganization.brandColor) {
        applyTheme(currentOrganization.brandColor, currentOrganization.accentColor || '#475569');
      } else {
        applyTheme('#0080FE', '#475569');
      }
    }
  }, [currentOrganization]);

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

      case 'USERS':
      case 'USER_DETAIL':
        // Old user detail / list logic is replaced by AccountSettingsPage
        // But wait, AccountSettingsPage is for MY account.
        // What about viewing OTHER users?
        // The requirement says: "Redesign the current 'User Profile -> Team Members' page into a clean Account Settings page".
        // It implies the list view is now part of Account Settings (Team Management).
        // Viewing other users details might be less critical or handled within the table?
        // "Team List ... Actions: change role, remove member". No "View Detail" mentioned explicitly in requirements.
        // But if we clicked a user in the old list, we went to detail.
        // Requirement: "Team & User Management... Team List... Actions...".
        // Let's assume for now we use AccountSettingsPage.
        // If selectedId is set and it's NOT the current user, we might need a read-only detail view?
        // Or maybe just redirect to AccountSettingsPage if it's the current user, or if we are listing users.

        // Actually, "User Profile -> Team Members" was the page.
        // "UserDetailPage" handled everything.
        // Let's route USERS to AccountSettingsPage.
        // If viewing a specific user (USER_DETAIL), we might still need a Detail View if it's not "Me".
        // However, the redesign seems to consolidate everything into "Account Settings".

        // If selectedId is present and != currentUser.id, we might still want UserDetailPage?
        // Requirement says "Visible to all users -> My Account". "Org accounts only -> Team & User Management".
        // This suggests standard users can't see the team list?
        // "Hide this entire section for Individual accounts."
        // What about "Non-Individual" (e.g. Member of an Org)? "Org accounts only" usually means the Organization Entity, or perhaps "Org Admins"?
        // "Only Org Admins can edit org settings and manage team".
        // So Members can only see "My Account". They can't see the Team List?
        // If so, they can't browse other users.
        // That's a significant change if we strictly follow "Hide this entire section for Individual accounts" AND "Only Org Admins can... manage team".
        // BUT, usually members can SEE the team.
        // "My Account (visible to all users)... Team & User Management (Org accounts only)". 
        // "Hide this entire section for Individual accounts" implies if I am an Org Member, I might see it?
        // "Actions: change role... (only Org Admins)". 
        // Let's assume Members have read-only access to Team List?
        // Or is "Account Settings" strictly personal + admin?
        // Let's implement as requested: Replaces the page.

        return <AccountSettingsPage
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />;

      case 'SETTINGS':
        return <SettingsPage currentUser={currentUser} onNavigate={handleNavigate} />;

      case 'BILLING':
        return <BillingPage currentUser={currentUser} onNavigate={handleNavigate} />;

      case 'FEED':
      default:
        return <GlobalFeedPage
          currentUser={currentUser}
          onNavigate={handleNavigate}
        />;
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
    applyTheme('#0080FE', '#475569'); // Reset to default
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-light dark:bg-dark-bg transition-colors duration-200">
        <Header
          onNavigate={handleNavigate}
          currentView={currentView}
          organizations={organizations}
          currentOrganizationId={currentOrganizationId}
          onSwitchOrganization={handleSwitchOrganization}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="container mx-auto">
            {notification && <Notification message={notification} />}
            {renderContent()}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
};

export default App;
