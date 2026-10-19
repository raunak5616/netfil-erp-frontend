import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { approveOrRejectClient } from '../../services/clientService';
import { 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Building2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  ShieldCheck
} from 'lucide-react';

const ClientDetailModal = ({ client, isOpen, onClose, onEdit, canEdit, onStatusUpdate }) => {
  const { isAdmin } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

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

  const isIndia = (client.country || 'India').trim().toLowerCase() === 'india';

  const fullLocation = [
    client.address,
    client.addressLine2,
    client.city,
    client.state,
    client.pincode,
    client.country || 'India',
  ]
    .filter(Boolean)
    .join(', ');

  const currentApprovalStatus = client.approvalStatus || 'APPROVED';

  const handleApprove = async () => {
    if (!window.confirm(`Approve Party "${client.companyName}" (${client.clientCode})?`)) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await approveOrRejectClient(client._id, { action: 'APPROVE' });
      if (res.success) {
        if (onStatusUpdate) onStatusUpdate(res.client);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to approve party');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setErrorMsg('Please specify a rejection reason.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await approveOrRejectClient(client._id, { 
        action: 'REJECT',
        rejectionReason: rejectionReason.trim()
      });
      if (res.success) {
        setIsRejecting(false);
        setRejectionReason('');
        if (onStatusUpdate) onStatusUpdate(res.client);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reject party');
    } finally {
      setActionLoading(false);
    }
  };

  const getActorName = (actor) => {
    if (!actor) return '—';
    if (typeof actor === 'object') {
      return actor.fullName || actor.name || actor.username || actor.email || '—';
    }
    return String(actor);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsRejecting(false);
        setErrorMsg('');
        onClose();
      }}
      title={`Party Account — ${client.clientCode}`}
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isAdmin && currentApprovalStatus === 'PENDING_APPROVAL' && !isRejecting && (
              <>
                <Button
                  variant="primary"
                  icon={CheckCircle}
                  loading={actionLoading}
                  style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                  onClick={handleApprove}
                >
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  icon={XCircle}
                  disabled={actionLoading}
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => setIsRejecting(true)}
                >
                  Reject...
                </Button>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
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
                Edit Party
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMsg && <Alert type="danger" message={errorMsg} />}

        {/* Rejection Alert if rejected */}
        {currentApprovalStatus === 'REJECTED' && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '12px 14px',
              color: '#991b1b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
              <AlertTriangle size={15} color="#dc2626" />
              Party Record Rejected
            </div>
            <div style={{ fontSize: '12.5px', marginTop: '2px', color: '#7f1d1d' }}>
              <strong>Reason:</strong> {client.rejectionReason || 'No reason provided.'}
            </div>
            {(client.rejectedBy || client.rejectedAt) && (
              <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '6px' }}>
                Rejected by {getActorName(client.rejectedBy)} on {formatDate(client.rejectedAt)}
              </div>
            )}
          </div>
        )}

        {/* Inline Rejection Reason Form */}
        {isRejecting && (
          <form
            onSubmit={handleRejectSubmit}
            style={{
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '6px',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#9a3412', marginBottom: '6px' }}>
              Enter Rejection Reason (Mandatory)
            </div>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="State the specific reason why this party account cannot be approved..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #fdba74',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button size="sm" variant="secondary" onClick={() => setIsRejecting(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                type="submit"
                loading={actionLoading}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        )}

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
              Party Code
            </div>
            <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-700)', marginTop: '2px' }}>
              {client.clientCode}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Party Name
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-900)', marginTop: '2px' }}>
              {client.companyName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
              Approval Status
            </div>
            <StatusBadge status={currentApprovalStatus} />
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
              Active Status
            </div>
            <StatusBadge status={client.status} />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--neutral-500)', fontWeight: 600 }}>
              Registered Address
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: isIndia ? 'var(--neutral-600)' : '#1d4ed8', backgroundColor: isIndia ? 'var(--neutral-100)' : '#dbeafe', padding: '1px 8px', borderRadius: '10px' }}>
              {client.country || 'India'}
            </span>
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

        {/* Audit Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 12px',
            fontSize: '11.5px',
            color: 'var(--neutral-600)',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '10px 12px',
          }}
        >
          <div>
            <span style={{ color: 'var(--neutral-400)', display: 'block' }}>Submitted / Created By:</span>
            <strong>{getActorName(client.createdBy)}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--neutral-400)', display: 'block' }}>Submission Date:</span>
            <strong>{formatDate(client.createdAt)}</strong>
          </div>
          {currentApprovalStatus === 'APPROVED' && client.approvedAt && (
            <>
              <div>
                <span style={{ color: 'var(--neutral-400)', display: 'block' }}>Approved By:</span>
                <strong>{getActorName(client.approvedBy)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--neutral-400)', display: 'block' }}>Approval Date:</span>
                <strong>{formatDate(client.approvedAt)}</strong>
              </div>
            </>
          )}
          {currentApprovalStatus === 'REJECTED' && client.rejectedAt && (
            <>
              <div>
                <span style={{ color: 'var(--neutral-400)', display: 'block' }}>Rejected By:</span>
                <strong>{getActorName(client.rejectedBy)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--neutral-400)', display: 'block' }}>Rejection Date:</span>
                <strong>{formatDate(client.rejectedAt)}</strong>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ClientDetailModal;

