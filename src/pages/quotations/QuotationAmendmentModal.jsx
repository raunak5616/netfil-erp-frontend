import React, { useState, useEffect } from 'react';
import {
  createQuotationAmendment,
  getQuotationAmendments,
} from '../../services/quotationService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input } from '../../components/ui/FormField';
import { FileDiff, History, Plus } from 'lucide-react';

const QuotationAmendmentModal = ({ isOpen, onClose, onSuccess, quotation }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [amendmentHistory, setAmendmentHistory] = useState([]);

  // Form Data for Amendment
  const [reason, setReason] = useState('');
  const [amendmentRemarks, setAmendmentRemarks] = useState('');
  const [discountAmount, setDiscountAmount] = useState(quotation?.discountAmount || 0);
  const [pfAmount, setPfAmount] = useState(quotation?.pfAmount || 0);
  const [freightAmount, setFreightAmount] = useState(quotation?.freightAmount || 0);
  const [taxRate, setTaxRate] = useState(quotation?.taxRate || 0);

  useEffect(() => {
    if (isOpen && quotation?._id) {
      setReason('');
      setAmendmentRemarks('');
      setDiscountAmount(quotation.discountAmount || 0);
      setPfAmount(quotation.pfAmount || 0);
      setFreightAmount(quotation.freightAmount || 0);
      setTaxRate(quotation.taxRate || 0);
      fetchHistory();
    }
  }, [isOpen, quotation?._id]);

  const fetchHistory = async () => {
    if (!quotation?._id) return;
    setLoadingHistory(true);
    try {
      const res = await getQuotationAmendments(quotation._id);
      if (res.success && Array.isArray(res.amendments)) {
        setAmendmentHistory(res.amendments);
      }
    } catch (err) {
      console.error('Failed to fetch amendment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('Amendment reason is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reason: reason.trim(),
        remarks: amendmentRemarks,
        headerUpdates: {
          discountAmount: Number(discountAmount) || 0,
          pfAmount: Number(pfAmount) || 0,
          freightAmount: Number(freightAmount) || 0,
          taxRate: Number(taxRate) || 0,
        },
      };

      const res = await createQuotationAmendment(quotation._id, payload);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || 'Failed to create amendment');
      }
    } catch (err) {
      console.error('Create amendment error:', err);
      setError(err.response?.data?.message || 'Failed to create quotation amendment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !quotation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileDiff size={18} color="var(--primary-600)" />
          <span>Quotation Amendment ({quotation.quotationNo})</span>
        </div>
      }
      maxWidth="700px"
    >
      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--gray-200)', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'create' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'create' ? 'var(--primary-600)' : 'var(--gray-600)',
          }}
        >
          <Plus size={14} style={{ display: 'inline', marginRight: '4px' }} /> Create New Amendment
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'history' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'history' ? 'var(--primary-600)' : 'var(--gray-600)',
          }}
        >
          <History size={14} style={{ display: 'inline', marginRight: '4px' }} /> Amendment History ({amendmentHistory.length})
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {activeTab === 'create' ? (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Amendment Reason *</label>
            <Input
              type="text"
              placeholder="e.g. Revised tax rate, updated discount, terms modification"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-700)', marginBottom: '8px' }}>
              Header Commercial Updates (Optional)
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Discount Amount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">P&F Amount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={pfAmount}
                  onChange={(e) => setPfAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Freight Amount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={freightAmount}
                  onChange={(e) => setFreightAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Tax Rate (%)</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Amendment Remarks</label>
            <Input
              type="text"
              placeholder="Internal notes for this amendment version"
              value={amendmentRemarks}
              onChange={(e) => setAmendmentRemarks(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--gray-200)', paddingTop: '12px' }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating Amendment...' : 'Create Amendment'}
            </Button>
          </div>
        </form>
      ) : (
        <div>
          {loadingHistory ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>Loading amendment history...</div>
          ) : amendmentHistory.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--gray-500)' }}>
              No amendments created yet for this quotation.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {amendmentHistory.map((am) => (
                <div
                  key={am._id}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '6px',
                    background: 'var(--gray-50)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                      {am.amendmentNo}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                      {new Date(am.createdAt).toLocaleString('en-GB')}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--gray-900)' }}>
                    <strong>Reason:</strong> {am.reason}
                  </div>
                  {am.remarks && (
                    <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '2px' }}>
                      <strong>Remarks:</strong> {am.remarks}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                    Created by: {am.createdBy?.username || 'User'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default QuotationAmendmentModal;
