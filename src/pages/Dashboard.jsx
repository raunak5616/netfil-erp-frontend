import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, hasPermission } = useAuth();
  const canViewEmployees = hasPermission('EMPLOYEE_VIEW');

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Welcome, {user?.employee?.fullName || user?.username}!</h1>
          <p className="text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>
            NETFIL ERP Enterprise Control Panel
          </p>
        </div>
        <img src="/logo.png" alt="Netfil Clean Solutions" className="h-10 w-auto object-contain hidden sm:block bg-white p-1 rounded-lg border border-slate-200 shadow-2xs" />
      </div>

      <div className="alert alert-success">
        <CheckCircle2 size={18} />
        <span>Authenticated as <strong>{user?.username}</strong> with role <strong>{user?.role?.roleName || 'System User'}</strong>.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
              Active Module
            </span>
            <Users size={20} color="var(--primary-600)" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Employee Master</h3>
          <p className="text-muted" style={{ fontSize: '13px' }}>
            Fully integrated with permissions, CRUD actions, search, and department mappings.
          </p>
          {canViewEmployees ? (
            <Link to="/employees" className="btn btn-primary btn-sm" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
              <span>Manage Employees</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--danger-500)', fontWeight: 500 }}>
              Permission EMPLOYEE_VIEW required
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
