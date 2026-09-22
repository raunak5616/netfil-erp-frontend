import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Textarea, FormField } from '../../components/ui/FormField';
import { addQuotationFollowUp } from '../../services/quotationService';
import { Calendar, History, Clock } from 'lucide-react';

const QuotationFollowUpModal = ({ isOpen, onClose, quotation, onSuccess }) => {
  const [followUpDate, setFollowUpDate] = useState(() => {
    // Default to +3 days from today
    const dt = new Date();
    dt.setDate(dt.getDate() + 3);
    return dt.toISOString().split('T')[0];
  });
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !quotation) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!followUpDate) {
      setError('Please select a next follow-up date');
      return;
    }

    if (!remarks.trim()) {
      setError('Please enter follow-up remarks');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await addQuotationFollowUp(quotation._id, {
        followUpDate,
        remarks: remarks.trim(),
      });

      if (res.success) {
        onSuccess(res.quotation);
      } else {
        setError(res.message || 'Failed to add follow-up');
      }
    } catch (err) {
      console.error('Add Follow-up error:', err);
      setError(err.response?.data?.message || 'Error occurred while saving follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-700)' }}>
          <Calendar size={18} />
          <span>Add Quotation Follow-up</span>
        </div>
      }
      maxWidth="600px"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Quotation Header Summary */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--neutral-50)',
              border: '1px solid var(--neutral-200)',
              borderRadius: '8px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Quotation No
              </div>
              <div style={{ fontWeight: 700, color: 'var(--primary-700)' }} className="font-mono">
                {quotation.quotationNo}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Customer
              </div>
              <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                {quotation.client?.companyName || 'N/A'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Status
              </div>
              <div style={{ fontWeight: 600, color: 'var(--primary-600)', textTransform: 'uppercase', fontSize: '12px' }}>
                {quotation.status}
              </div>
            </div>
          </div>

          {/* Next Follow-up Date Field */}
          <FormField label="Next Follow-up Date *" helpText="Schedule when the next follow-up with the client is expected">
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              required
            />
          </FormField>

          {/* Follow-up Remarks */}
          <FormField label="Follow-up Remarks / Client Feedback *" helpText="Record discussion points, client updates, or next steps">
            <Textarea
              rows={3}
              placeholder="e.g. Spoke with Procurement Lead Mr. Sharma. Technical specs approved; commercial approval pending with VP finance by Friday."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
            />
          </FormField>

          {/* Historical Follow-ups Section */}
          {quotation.followUps && quotation.followUps.length > 0 && (
            <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '12px' }}>
              <h5 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={14} color="var(--primary-600)" />
                Previous Follow-up History ({quotation.followUps.length})
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                {quotation.followUps.slice().reverse().map((fu, idx) => (
                  <div
                    key={fu._id || idx}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--neutral-50)',
                      border: '1px solid var(--neutral-200)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--neutral-600)', fontSize: '11px', marginBottom: '2px' }}>
                      <span>Follow-up Date: <strong>{formatDate(fu.followUpDate)}</strong></span>
                      <span>{fu.followUpBy?.username ? `By ${fu.followUpBy.username}` : ''} ({formatDate(fu.createdAt)})</span>
                    </div>
                    <div style={{ color: 'var(--neutral-900)' }}>{fu.remarks}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--neutral-200)' }}>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting || !followUpDate || !remarks.trim()}>
              {submitting ? 'Saving...' : 'Save Follow-up'}
            </Button>
          </div>

        </div>
      </form>
    </Modal>
  );
};

export default QuotationFollowUpModal;
