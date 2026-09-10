import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Edit } from 'lucide-react';

const ItemGroupDetailModal = ({ itemGroup, isOpen, onClose, onEdit, canEdit }) => {
  if (!isOpen || !itemGroup) return null;

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
      title={`Item Group Details — ${itemGroup.groupCode}`}
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
                onEdit(itemGroup);
              }}
            >
              Edit Item Group
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
              Group Code
            </div>
            <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-700)', marginTop: '2px' }}>
              {itemGroup.groupCode}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Group Name
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-900)', marginTop: '2px' }}>
              {itemGroup.groupName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
              Status
            </div>
            <StatusBadge status={itemGroup.status} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--neutral-500)', fontWeight: 600, marginBottom: '4px' }}>
            Description
          </div>
          <div
            style={{
              fontSize: '13px',
              color: itemGroup.description ? 'var(--neutral-800)' : 'var(--neutral-400)',
              backgroundColor: '#ffffff',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid var(--neutral-200)',
              minHeight: '44px',
            }}
          >
            {itemGroup.description || 'No additional description provided.'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: 'var(--neutral-500)', paddingTop: '8px' }}>
          <div>
            <strong>Created:</strong> {formatDate(itemGroup.createdAt)}
          </div>
          <div>
            <strong>Last Updated:</strong> {formatDate(itemGroup.updatedAt)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ItemGroupDetailModal;
