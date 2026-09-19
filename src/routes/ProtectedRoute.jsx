import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ requiredPermission }) => {
  const { isAuthenticated, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <img src="/logo.png" alt="Netfil Clean Solutions" className="h-16 w-auto object-contain animate-pulse" />
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating NETFIL ERP...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '60px auto', textAlign: 'center', padding: '40px' }}>
        <ShieldAlert size={48} color="var(--danger-500)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Access Denied</h2>
        <p className="text-muted" style={{ marginBottom: '20px' }}>
          You do not have permission code <code>{requiredPermission}</code> required to access this module.
        </p>
        <button className="btn btn-secondary" onClick={() => window.history.back()}>
          Go Back
        </button>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
