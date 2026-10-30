import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Textarea, Select, FormField } from '../../components/ui/FormField';
import { useAddQuotationFollowUpMutation } from '../../features/quotations/quotationsApi';
import { Calendar, History, Clock, AlertCircle } from 'lucide-react';

const OUTCOME_OPTIONS = [
  { value: 'PENDING', label: 'In Progress / Pending Customer Reply' },
  { value: 'INTERESTED', label: 'Client Interested / Reviewing Specs' },
  { value: 'NEGOTIATING', label: 'Commercial / Price Negotiation' },
  { value: 'REQUOTE_REQUESTED', label: 'Re-quote / Revision Requested' },
  { value: 'POSTPONED', label: 'Requirement Postponed' },
  { value: 'NO_RESPONSE', label: 'No Response / Call Again' },
  { value: 'OTHER', label: 'Other Outcome' },
];

const QuotationFollowUpModal = ({ isOpen, onClose, quotation, onSuccess }) => {
  const [followUpDate, setFollowUpDate] = useState(() => {
    // Default to +3 days from today
    const dt = new Date();
    dt.setDate(dt.getDate() + 3);
    return dt.toISOString().split('T')[0];
  });
  const [followUpTime, setFollowUpTime] = useState('11:00');
  const [outcome, setOutcome] = useState('PENDING');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const [addQuotationFollowUpMutation, { isLoading: submitting }] = useAddQuotationFollowUpMutation();

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

    setError('');

    try {
      const res = await addQuotationFollowUpMutation({
        id: quotation._id,
        data: {
          followUpDate,
          followUpTime,
          outcome,
          outcomeNotes: outcomeNotes.trim(),
          remarks: remarks.trim(),
        },
      }).unwrap();

      if (res.success || res.quotation) {
        onSuccess(res.quotation || res);
      } else {
        setError(res.message || 'Failed to add follow-up');
      }
    } catch (err) {
      console.error('Add Follow-up error:', err);
      setError(err?.data?.message || err?.message || 'Error occurred while saving follow-up');
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
      maxWidth="650px"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Quotation Header & Deadline Context */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--neutral-50)',
              border: '1px solid var(--neutral-200)',
              borderRadius: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
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
              <div style={{ fontWeight: 600, color: 'var(--neutral-900)', fontSize: '13px' }} className="truncate">
                {quotation.client?.companyName || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Attention Deadline
              </div>
              <div style={{ fontWeight: 600, color: quotation.deadline ? 'var(--neutral-800)' : 'var(--neutral-400)', fontSize: '12.5px' }}>
                {quotation.deadline ? formatDate(quotation.deadline) : 'No Deadline'}
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

          {/* Date & Time Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <FormField label="Next Follow-up Date *" helpText="Scheduled date for client touchpoint">
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Time" helpText="Scheduled time">
              <Input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
              />
            </FormField>
          </div>

          {/* Outcome & Next Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Follow-up Outcome Status" helpText="Current discussion status">
              <Select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                {OUTCOME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Actionable Next Step" helpText="Brief next action note">
              <Input
                placeholder="e.g. Call VP on Friday"
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
              />
            </FormField>
          </div>

          {/* Follow-up Remarks */}
          <FormField label="Follow-up Remarks / Client Discussion Notes *" helpText="Record discussion points, client updates, objections, or commitments">
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--neutral-600)', fontSize: '11px', marginBottom: '3px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Follow-up: <strong>{formatDate(fu.followUpDate)}</strong> {fu.followUpTime ? `@ ${fu.followUpTime}` : ''}</span>
                        {fu.outcome && (
                          <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'var(--primary-50)', color: 'var(--primary-700)', fontWeight: 600 }}>
                            {fu.outcome}
                          </span>
                        )}
                      </span>
                      <span>{fu.followUpBy?.username ? `By ${fu.followUpBy.username}` : ''} ({formatDate(fu.createdAt)})</span>
                    </div>
                    <div style={{ color: 'var(--neutral-900)' }}>{fu.remarks}</div>
                    {fu.outcomeNotes && (
                      <div style={{ color: 'var(--neutral-500)', fontSize: '11px', marginTop: '2px', fontStyle: 'italic' }}>
                        Next action: {fu.outcomeNotes}
                      </div>
                    )}
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
