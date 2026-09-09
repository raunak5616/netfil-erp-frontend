import React from 'react';
import { X, UserCheck, Calendar, Mail, Phone, Briefcase, Building } from 'lucide-react';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Employee Details — {employee.employeeCode}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--neutral-200)' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-700)',
              fontSize: '22px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {employee.fullName ? employee.fullName.charAt(0).toUpperCase() : 'E'}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                {employee.fullName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span className="text-muted" style={{ fontSize: '13px' }}>{employee.designation}</span>
                <span>•</span>
                <span className={`badge ${employee.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                  {employee.status}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Employee Code</div>
              <div className="detail-value" style={{ fontFamily: 'var(--font-mono)' }}>
                {employee.employeeCode}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Department</div>
              <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={14} className="text-muted" />
                {employee.department?.departmentName || 'N/A'} ({employee.department?.departmentCode || 'N/A'})
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Designation</div>
              <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={14} className="text-muted" />
                {employee.designation || 'N/A'}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Joining Date</div>
              <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} className="text-muted" />
                {formatDate(employee.joiningDate)}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Email Address</div>
              <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} className="text-muted" />
                {employee.email ? <a href={`mailto:${employee.email}`}>{employee.email}</a> : 'N/A'}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Mobile Number</div>
              <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} className="text-muted" />
                {employee.mobile || 'N/A'}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">System Record ID</div>
              <div className="detail-value" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--neutral-600)' }}>
                {employee._id}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Record Created</div>
              <div className="detail-value" style={{ fontSize: '13px' }}>
                {formatDate(employee.createdAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {canEdit && (
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
            >
              Edit Employee
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
