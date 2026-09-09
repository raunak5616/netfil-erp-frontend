import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Building2, Calendar, Hash } from 'lucide-react';

const DepartmentDetailModal = ({ department, isOpen, onClose, onEdit, canEdit }) => {
  if (!isOpen || !department) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Department Details — ${department.departmentCode}`}
      maxWidth="480px"
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
                onEdit(department);
              }}
            >
              Edit Department
            </Button>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--neutral-200)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)' }}>
              {department.departmentName}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-700)' }}>
                {department.departmentCode}
              </span>
              <span>•</span>
              <StatusBadge status={department.status} />
            </div>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <span className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)' }}>
              Department Code
            </span>
            <span className="font-mono" style={{ fontSize: '13.5px', fontWeight: 600 }}>
              {department.departmentCode}
            </span>
          </div>

          <div className="form-group">
            <span className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)' }}>
              Department Name
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: 500 }}>
              {department.departmentName}
            </span>
          </div>

          <div className="form-group">
            <span className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)' }}>
              Record Created
            </span>
            <span style={{ fontSize: '12.5px', color: 'var(--neutral-700)' }}>
              {formatDate(department.createdAt)}
            </span>
          </div>

          <div className="form-group">
            <span className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)' }}>
              Last Updated
            </span>
            <span style={{ fontSize: '12.5px', color: 'var(--neutral-700)' }}>
              {formatDate(department.updatedAt)}
            </span>
          </div>

          <div className="form-group full-width">
            <span className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)' }}>
              System Record ID
            </span>
            <span className="font-mono" style={{ fontSize: '11.5px', color: 'var(--neutral-600)' }}>
              {department._id}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DepartmentDetailModal;
