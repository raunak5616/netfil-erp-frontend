import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Edit, Sliders } from 'lucide-react';

const SpecificationDetailModal = ({ specification, isOpen, onClose, onEdit, canEdit }) => {
  if (!isOpen || !specification) return null;

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

  const getTypeStyle = (type) => {
    switch (type) {
      case 'number':
        return { bg: 'var(--info-50)', color: 'var(--info-800)', border: 'var(--info-200)' };
      case 'boolean':
        return { bg: 'var(--purple-50)', color: 'var(--purple-800)', border: 'var(--purple-200)' };
      case 'select':
        return { bg: 'var(--amber-50)', color: 'var(--amber-800)', border: 'var(--amber-200)' };
      default: // string
        return { bg: 'var(--neutral-100)', color: 'var(--neutral-800)', border: 'var(--neutral-300)' };
    }
  };

  const typeStyle = getTypeStyle(specification.dataType);
  const uomCode = specification.unit?.uomCode;
  const uomName = specification.unit?.uomName;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Specification Details — ${specification.specificationCode}`}
      maxWidth="520px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              icon={Edit}
              onClick={() => {
                onClose();
                onEdit(specification);
              }}
            >
              Edit Specification
            </Button>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            backgroundColor: 'var(--neutral-50)',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid var(--neutral-200)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Specification Code
            </div>
            <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-700)', marginTop: '2px' }}>
              {specification.specificationCode}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Specification Name
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-900)', marginTop: '2px' }}>
              {specification.specificationName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
              Data Type
            </div>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: typeStyle.bg,
                color: typeStyle.color,
                border: `1px solid ${typeStyle.border}`,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {specification.dataType}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
              Status
            </div>
            <StatusBadge status={specification.status} />
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Unit of Measure
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-800)', marginTop: '2px' }}>
              {uomCode ? `${uomCode} (${uomName})` : '—'}
            </div>
          </div>
        </div>

        {/* Options list for select type */}
        {specification.dataType === 'select' && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--neutral-500)', fontWeight: 600, marginBottom: '6px' }}>
              Configured Options ({specification.options?.length || 0})
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                backgroundColor: '#ffffff',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid var(--neutral-200)',
                minHeight: '44px',
              }}
            >
              {specification.options && specification.options.length > 0 ? (
                specification.options.map((opt, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: 'var(--neutral-100)',
                      color: 'var(--neutral-800)',
                      border: '1px solid var(--neutral-300)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {opt}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--neutral-400)' }}>No options defined.</span>
              )}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: '12px', color: 'var(--neutral-500)', fontWeight: 600, marginBottom: '4px' }}>
            Description
          </div>
          <div
            style={{
              fontSize: '13px',
              color: specification.description ? 'var(--neutral-800)' : 'var(--neutral-400)',
              backgroundColor: '#ffffff',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid var(--neutral-200)',
              minHeight: '44px',
            }}
          >
            {specification.description || 'No additional description provided.'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: 'var(--neutral-500)', paddingTop: '8px' }}>
          <div>
            <strong>Created:</strong> {formatDate(specification.createdAt)}
          </div>
          <div>
            <strong>Last Updated:</strong> {formatDate(specification.updatedAt)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SpecificationDetailModal;
