import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Edit, Phone, Mail, MapPin, Building2, User } from 'lucide-react';

const ClientDetailModal = ({ client, isOpen, onClose, onEdit, canEdit }) => {
  if (!isOpen || !client) return null;

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

  const fullLocation = [client.address, client.city, client.state, client.pincode]
    .filter(Boolean)
    .join(', ');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Client Account — ${client.clientCode}`}
      maxWidth="540px"
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
                onEdit(client);
              }}
            >
              Edit Client
            </Button>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header summary box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            backgroundColor: 'var(--neutral-50)',
            padding: '14px',
            borderRadius: '6px',
            border: '1px solid var(--neutral-200)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Client Code
            </div>
            <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-700)', marginTop: '2px' }}>
              {client.clientCode}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Company Name
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-900)', marginTop: '2px' }}>
              {client.companyName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
              Status
            </div>
            <StatusBadge status={client.status} />
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Contact Person
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-800)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={13} className="text-muted" />
              {client.contactPerson || '—'}
            </div>
          </div>
        </div>

        {/* Contact details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
              Mobile Phone
            </div>
            <div style={{ fontSize: '13px', color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
              <Phone size={14} color="var(--primary-600)" />
              {client.mobile || '—'}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
              Email Address
            </div>
            <div style={{ fontSize: '13px', color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
              <Mail size={14} color="var(--primary-600)" />
              {client.email || '—'}
            </div>
          </div>
        </div>

        {/* Location / Address Box */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--neutral-500)', fontWeight: 600, marginBottom: '4px' }}>
            Registered Address
          </div>
          <div
            style={{
              fontSize: '13px',
              color: fullLocation ? 'var(--neutral-800)' : 'var(--neutral-400)',
              backgroundColor: '#ffffff',
              padding: '10px 12px',
              borderRadius: '4px',
              border: '1px solid var(--neutral-200)',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <MapPin size={15} color="var(--primary-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{fullLocation || 'No registered address specified.'}</span>
          </div>
        </div>

        {/* Timestamps */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: 'var(--neutral-500)', paddingTop: '4px' }}>
          <div>
            <strong>Created:</strong> {formatDate(client.createdAt)}
          </div>
          <div>
            <strong>Last Updated:</strong> {formatDate(client.updatedAt)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ClientDetailModal;
