import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Edit } from 'lucide-react';

const UOMDetailModal = ({ uom, isOpen, onClose, onEdit, canEdit }) => {
  if (!isOpen || !uom) return null;

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

  const getDimensionBadgeStyle = (dim) => {
    switch (dim) {
      case 'WEIGHT':
        return { bg: 'var(--amber-50)', color: 'var(--amber-800)', border: 'var(--amber-200)' };
      case 'VOLUME':
        return { bg: 'var(--info-50)', color: 'var(--info-800)', border: 'var(--info-200)' };
      case 'LENGTH':
        return { bg: 'var(--purple-50)', color: 'var(--purple-800)', border: 'var(--purple-200)' };
      default: // COUNT
        return { bg: 'var(--primary-50)', color: 'var(--primary-800)', border: 'var(--primary-200)' };
    }
  };

  const dimStyle = getDimensionBadgeStyle(uom.dimension);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`UOM Details — ${uom.uomCode}`}
      maxWidth="500px"
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
                onEdit(uom);
              }}
            >
              Edit UOM
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
            border: '1px solid var(--neutral-200)'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              UOM Code
            </div>
            <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-700)', marginTop: '2px' }}>
              {uom.uomCode}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              UOM Name
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-900)', marginTop: '2px' }}>
              {uom.uomName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
              Dimension
            </div>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: dimStyle.bg,
                color: dimStyle.color,
                border: `1px solid ${dimStyle.border}`,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {uom.dimension}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
              Status
            </div>
            <StatusBadge status={uom.status} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--neutral-500)', fontWeight: 600, marginBottom: '4px' }}>
            Description
          </div>
          <div
            style={{
              fontSize: '13px',
              color: uom.description ? 'var(--neutral-800)' : 'var(--neutral-400)',
              backgroundColor: '#ffffff',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid var(--neutral-200)',
              minHeight: '44px'
            }}
          >
            {uom.description || 'No additional description provided.'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: 'var(--neutral-500)', pt: '8px' }}>
          <div>
            <strong>Created:</strong> {formatDate(uom.createdAt)}
          </div>
          <div>
            <strong>Last Updated:</strong> {formatDate(uom.updatedAt)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UOMDetailModal;
