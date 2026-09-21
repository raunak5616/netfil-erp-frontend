import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  User, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Check, 
  KeyRound,
  ShieldCheck
} from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter your username and password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await login(username, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setErrorMessage(res.message || 'Invalid username or password.');
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Unable to reach the server. Please check your network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername('admin');
    setPassword('Admin@123');
    setDemoLoaded(true);
    setErrorMessage('');
    setTimeout(() => setDemoLoaded(false), 2500);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 font-sans flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-blue-600 selection:text-white">
      
      {/* Top Bar Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Netfil Clean Solutions" 
            className="h-9 w-auto object-contain" 
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck size={15} className="text-slate-400" />
          <span>Secure Enterprise Sign-In</span>
        </div>
      </header>

      {/* Main Form Center Container */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8">
          
          {/* Brand Header */}
          <div className="mb-6 text-left">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Sign in to Netfil ERP
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your corporate credentials to access the system
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  disabled={submitting}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={submitting}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors disabled:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                />
                <span>Remember username</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg text-sm transition-colors duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Discrete Demo Login Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-700">Demo Account:</span>{' '}
              <span className="font-mono text-slate-600">admin / Admin@123</span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="px-2.5 py-1 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              {demoLoaded ? <Check size={13} className="text-emerald-600" /> : null}
              {demoLoaded ? 'Filled' : 'Auto Fill'}
            </button>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto py-4 text-center text-xs text-slate-400 border-t border-slate-200/60">
        <div>© {new Date().getFullYear()} Netfil Clean Solutions. All rights reserved.</div>
      </footer>

      {/* Password Reset Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-slate-800">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Reset Credentials</h3>
                <p className="text-xs text-slate-500">Netfil ERP Support</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Passwords are managed centrally by system administrators. Please contact your IT administrator or HR manager to reset your password.
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div><strong>Default Demo Username:</strong> <code>admin</code></div>
              <div><strong>Default Demo Password:</strong> <code>Admin@123</code></div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
