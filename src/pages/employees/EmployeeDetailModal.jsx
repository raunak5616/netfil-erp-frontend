import React from 'react';
import { UserCheck, Calendar, Mail, Phone, Briefcase, Building } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const EmployeeDetailModal = ({ employee, isOpen, onClose, onEdit, canEdit }) => {
  if (!isOpen || !employee) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Employee Details — ${employee.employeeCode}`}
      maxWidth="540px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
            >
              Edit Employee
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-200/80">
        <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-800 text-xl font-bold flex items-center justify-center shrink-0">
          {employee.fullName ? employee.fullName.charAt(0).toUpperCase() : 'E'}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            {employee.fullName}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-slate-500 font-medium">{employee.designation}</span>
            <span className="text-slate-300">•</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${employee.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
              {employee.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium mb-0.5">Employee Code</div>
          <div className="font-mono font-semibold text-slate-900">
            {employee.employeeCode}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium mb-0.5">Department</div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Building size={14} className="text-slate-400 shrink-0" />
            <span>{employee.department?.departmentName || 'N/A'} ({employee.department?.departmentCode || 'N/A'})</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium mb-0.5">Designation</div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Briefcase size={14} className="text-slate-400 shrink-0" />
            <span>{employee.designation || 'N/A'}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium mb-0.5">Joining Date</div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <span>{formatDate(employee.joiningDate)}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium mb-0.5">Email Address</div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 truncate">
            <Mail size={14} className="text-slate-400 shrink-0" />
            {employee.email ? <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">{employee.email}</a> : 'N/A'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium mb-0.5">Mobile Number</div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Phone size={14} className="text-slate-400 shrink-0" />
            <span>{employee.mobile || 'N/A'}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium mb-0.5">System Record ID</div>
          <div className="font-mono text-[11px] text-slate-600 truncate">
            {employee._id}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium mb-0.5">Record Created</div>
          <div className="font-semibold text-slate-900">
            {formatDate(employee.createdAt)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeDetailModal;
