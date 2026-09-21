import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { User, ShieldCheck, Calendar, Clock, Building, UserCheck } from 'lucide-react';

const UserDetailModal = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const rolesList = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : user.role
    ? [user.role]
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`User Account Details — ${user.username}`}
      maxWidth="540px"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-200/80">
        <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-800 text-xl font-bold flex items-center justify-center shrink-0">
          {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight font-mono">
            {user.username}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-slate-500 font-medium">{user.employee?.fullName || 'Unlinked Account'}</span>
            <span className="text-slate-300">•</span>
            <StatusBadge status={user.isActive ? 'active' : 'inactive'} label={user.isActive ? 'Active' : 'Inactive'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-full">
          <div className="text-slate-400 font-medium mb-1">Linked Employee</div>
          {user.employee ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                {user.employee.fullName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{user.employee.fullName}</div>
                <div className="font-mono text-[11px] text-slate-500">
                  {user.employee.employeeCode} {user.employee.designation ? `— ${user.employee.designation}` : ''}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-slate-400 italic">No employee record linked</span>
          )}
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-full">
          <div className="text-slate-400 font-medium mb-1.5">Assigned System Roles</div>
          {rolesList.length === 0 ? (
            <span className="text-slate-400 italic">No roles assigned</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {rolesList.map((r, idx) => {
                const name = typeof r === 'string' ? r : r?.roleName || 'Role';
                const desc = typeof r === 'object' ? r?.description : null;
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200/80 font-semibold text-xs"
                  >
                    <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                    <span>{name}</span>
                    {desc && <span className="text-[10.5px] text-blue-600 font-normal">({desc})</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium mb-1 flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400" />
            <span>Last Login</span>
          </div>
          <div className="font-semibold text-slate-900">
            {formatDate(user.lastLogin)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium mb-1 flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400" />
            <span>Account Created</span>
          </div>
          <div className="font-semibold text-slate-900">
            {formatDate(user.createdAt)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UserDetailModal;
