import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Select, Textarea, FormField } from '../../components/ui/FormField';
import { markQuotationLost } from '../../services/quotationService';
import { AlertTriangle, FileX } from 'lucide-react';

const LOST_REASONS = [
  { value: 'PRICE_TOO_HIGH', label: 'Price Too High' },
  { value: 'COMPETITOR_SELECTED', label: 'Competitor Selected' },
  { value: 'CUSTOMER_CANCELLED', label: 'Customer Cancelled' },
  { value: 'REQUIREMENT_POSTPONED', label: 'Requirement Postponed' },
  { value: 'REQUIREMENT_CANCELLED', label: 'Requirement Cancelled' },
  { value: 'TECHNICAL_REASON', label: 'Technical Reason / Non-conformance' },
  { value: 'DELIVERY_TIMELINE', label: 'Delivery Timeline Unsuitable' },
  { value: 'PAYMENT_TERMS', label: 'Payment Terms Disagreement' },
  { value: 'BUDGET_ISSUE', label: 'Customer Budget Issue' },
  { value: 'NO_RESPONSE', label: 'No Response / Unresponsive' },
  { value: 'OTHER', label: 'Other Reason' },
];

const QuotationLostModal = ({ isOpen, onClose, quotation, onSuccess }) => {
  const [lostReason, setLostReason] = useState('');
  const [lostRemarks, setLostRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !quotation) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lostReason) {
      setError('Please select a valid Lost Reason');
      return;
    }

    if (!lostRemarks.trim()) {
      setError('Please enter remarks detailing the lost reason');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await markQuotationLost(quotation._id, {
        lostReason,
        lostRemarks: lostRemarks.trim(),
      });

      if (res.success) {
        onSuccess(res.quotation);
      } else {
        setError(res.message || 'Failed to mark quotation as lost');
      }
    } catch (err) {
      console.error('Mark Quotation Lost error:', err);
      setError(err.response?.data?.message || 'Error occurred while updating quotation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-700)' }}>
          <FileX size={18} />
          <span>Mark Quotation as Lost</span>
        </div>
      }
      maxWidth="540px"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Header Summary */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--neutral-50)',
              border: '1px solid var(--neutral-200)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
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
                Quotation Value
              </div>
              <div style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>
                ₹{(quotation.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Lost Reason Select */}
          <FormField label="Lost Reason *" helpText="Select the primary reason why this deal was lost">
            <Select
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              required
            >
              <option value="">-- Select Reason --</option>
              {LOST_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Lost Remarks Textarea */}
          <FormField label="Remarks / Feedback Details *" helpText="Provide specific feedback or detailed commentary">
            <Textarea
              rows={3}
              placeholder="e.g. Client opted for competitor X due to 10% lower pricing and shorter delivery timeframe."
              value={lostRemarks}
              onChange={(e) => setLostRemarks(e.target.value)}
              required
            />
          </FormField>

          <div
            style={{
              padding: '10px 12px',
              background: 'var(--warning-50)',
              border: '1px solid var(--warning-200)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--warning-800)',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={16} style={{ shrink: 0, marginTop: '2px' }} />
            <div>
              Marking this quotation as <strong>LOST</strong> will record this outcome permanently in the commercial audit log.
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--neutral-200)' }}>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={submitting || !lostReason || !lostRemarks.trim()}>
              {submitting ? 'Updating...' : 'Mark as Lost'}
            </Button>
          </div>

        </div>
      </form>
    </Modal>
  );
};

export default QuotationLostModal;
