
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
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For registration
  
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
        await register({ name, email, password });
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
    // Development shortcut - assumes this user exists in your DB/Mock
    onLogin('alex@acme.com', 'password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="bg-primary text-white p-2 rounded-lg">
              <Icon name="tracks" className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-800 tracking-tight">Track75</span>
          </div>
        </div>
        
        <div className="flex mb-6 border-b border-gray-200">
          <button 
            className={`flex-1 pb-3 text-sm font-semibold transition-colors ${isLoginView ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setIsLoginView(true); setRegisterError(null); }}
          >
            Sign In
          </button>
          <button 
            className={`flex-1 pb-3 text-sm font-semibold transition-colors ${!isLoginView ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setIsLoginView(false); setRegisterError(null); }}
          >
            Create Account
          </button>
        </div>

        {(error || registerError) && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center animate-fade-in">
            <Icon name="bug-issue" className="w-4 h-4 mr-2 flex-shrink-0" />
            {error || registerError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginView && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              placeholder="you@company.com"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || isRegistering}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20 flex justify-center"
          >
            {(isLoading || isRegistering) ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              isLoginView ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>
        
        {isLoginView && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Development Shortcut</span>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={handleShortcutLogin}
              disabled={isLoading}
              className="mt-4 w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm flex items-center justify-center border border-gray-200"
            >
              <Icon name="code-bracket" className="w-4 h-4 mr-2" />
              Test Login (Alex)
            </button>
          </div>
        )}
        
        <p className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Track75 Project Management
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
