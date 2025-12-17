
import React, { useState } from 'react';
import Icon from './Icon';
import { register } from '../api/authApi';

interface LoginPageProps {
  onLogin: (email: string, password?: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading, error }) => {
  const [isLoginView, setIsLoginView] = useState(true);

  // Registration Inputs
  const [activeTab, setActiveTab] = useState<'individual' | 'organization'>('individual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Full Name
  const [organizationName, setOrganizationName] = useState(''); // Only for Org Signup

  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (isLoginView) {
      if (email) {
        onLogin(email, password);
      }
    } else {
      // Registration Logic
      try {
        setIsRegistering(true);
        if (activeTab === 'organization' && !organizationName.trim()) {
          throw new Error('Organization Name is required');
        }

        await register({
          name,
          email,
          password,
          organizationName: activeTab === 'organization' ? organizationName : undefined
        });

        // Auto-login after successful registration
        await onLogin(email, password);
      } catch (err: any) {
        setRegisterError(err.message || 'Registration failed');
      } finally {
        setIsRegistering(false);
      }
    }
  };

  const handleShortcutLogin = () => {
    onLogin('alex@acme.com', 'password');
  };

  const toggleView = (view: 'login' | 'signup') => {
    setIsLoginView(view === 'login');
    setRegisterError(null);
    // Reset fields optional? Keep for UX convenience
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4 font-sans transition-colors duration-200">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl max-w-[400px] w-full border border-gray-100 dark:border-dark-elevated overflow-hidden">

        {/* Header Section */}
        <div className="bg-white dark:bg-dark-card pt-8 pb-6 px-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/5 rounded-xl mb-4">
            <Icon name="tracks" className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isLoginView ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {isLoginView ? 'Enter your details to access your workspace.' : 'Start managing your projects efficiently.'}
          </p>
        </div>

        {/* Form Section */}
        <div className="px-8 pb-8">

          {/* Toggle Login/Signup */}
          <div className="flex bg-gray-100 dark:bg-dark-elevated p-1 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => toggleView('login')}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${isLoginView ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => toggleView('signup')}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${!isLoginView ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          {(error || registerError) && (
            <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-3 rounded-lg mb-5 text-sm flex items-start animate-fade-in border border-red-100 dark:border-red-900/20">
              <Icon name="bug-issue" className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error || registerError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {!isLoginView && (
              <div className="space-y-4 animate-fade-in">
                {/* Individual vs Organization Toggle */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div
                    onClick={() => setActiveTab('individual')}
                    className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${activeTab === 'individual' ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary' : 'border-gray-200 dark:border-dark-elevated hover:border-gray-300 dark:hover:border-gray-500'}`}
                  >
                    <div className={`text-sm font-bold ${activeTab === 'individual' ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>Individual</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">For personal use</div>
                  </div>
                  <div
                    onClick={() => setActiveTab('organization')}
                    className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${activeTab === 'organization' ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary' : 'border-gray-200 dark:border-dark-elevated hover:border-gray-300 dark:hover:border-gray-500'}`}
                  >
                    <div className={`text-sm font-bold ${activeTab === 'organization' ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>Organization</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">For teams & companies</div>
                  </div>
                </div>

                {activeTab === 'organization' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-dark-elevated border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none placeholder-gray-400 dark:text-white"
                      placeholder="Acme Corp"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                    {activeTab === 'organization' ? 'Admin Full Name' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-elevated border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none placeholder-gray-400 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                {activeTab === 'organization' && !isLoginView ? 'Admin Email' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-dark-elevated border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none placeholder-gray-400 dark:text-white"
                placeholder="name@work.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Password</label>
                {isLoginView && (
                  <a href="#" className="text-xs text-primary font-semibold hover:underline" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
                )}
              </div>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-dark-elevated border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none placeholder-gray-400 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isRegistering}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20 flex justify-center mt-2 relative overflow-hidden"
            >
              {(isLoading || isRegistering) ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isLoginView ? 'Sign In' : (activeTab === 'organization' ? 'Create Organization' : 'Create Account')
              )}
            </button>
          </form>

          {isLoginView && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-elevated space-y-2">
              <button
                type="button"
                onClick={() => onLogin('admin@example.com', 'password')}
                disabled={isLoading}
                className="w-full bg-gray-50 dark:bg-dark-bg/50 text-gray-600 dark:text-gray-400 py-2 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors text-xs flex items-center justify-center border border-gray-200 dark:border-dark-elevated"
              >
                <Icon name="code-bracket" className="w-3.5 h-3.5 mr-2 text-gray-400" />
                Dev Shortcut: Login as Admin
              </button>
              <button
                type="button"
                onClick={() => onLogin('admin@v75inc.com', 'password')}
                disabled={isLoading}
                className="w-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 py-2 rounded-lg font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-xs flex items-center justify-center border border-purple-200 dark:border-purple-800/50"
              >
                <Icon name="organization" className="w-3.5 h-3.5 mr-2 text-purple-500" />
                Dev Shortcut: Login as ORG
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
