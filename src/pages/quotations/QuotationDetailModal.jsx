import React, { useState, useEffect } from 'react';
import { getQuotationById, releaseQuotation, getQuotationReferences } from '../../services/quotationService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import {
  Building2,
  Calendar,
  User,
  Package,
  FileText,
  Clock,
  Edit,
  CheckCircle2,
  FileDiff,
  Tag,
  DollarSign,
} from 'lucide-react';

const QuotationDetailModal = ({
  isOpen,
  onClose,
  quotationId,
  onEdit,
  onRelease,
  canEdit,
  canRelease,
  canAmend,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quotation, setQuotation] = useState(null);
  const [items, setItems] = useState([]);
  const [terms, setTerms] = useState([]);
  const [references, setReferences] = useState(null);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!quotationId) return;
      setLoading(true);
      setError('');
      try {
        const [detailRes, refRes] = await Promise.all([
          getQuotationById(quotationId),
          getQuotationReferences(quotationId).catch(() => ({ success: false })),
        ]);

        if (detailRes.success && detailRes.quotation) {
          setQuotation(detailRes.quotation);
          setItems(detailRes.items || []);
          setTerms(detailRes.terms || []);
        } else {
          setError('Quotation details not found');
        }

        if (refRes.success && refRes.references) {
          setReferences(refRes.references);
        }
      } catch (err) {
        console.error('Failed to fetch quotation details:', err);
        setError(err.response?.data?.message || 'Failed to load quotation details');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDetail();
    }
  }, [isOpen, quotationId]);

  if (!isOpen) return null;

  const handleReleaseAction = async () => {
    if (!quotation) return;
    const confirmMsg = `Are you sure you want to RELEASE Quotation "${quotation.quotationNo}"? Once released, direct edits will be locked.`;
    if (!window.confirm(confirmMsg)) return;

    setReleasing(true);
    try {
      const res = await releaseQuotation(quotation._id);
      if (res.success) {
        setQuotation((prev) => ({ ...prev, status: 'released' }));
        if (onRelease) onRelease();
      }
    } catch (err) {
      console.error('Failed to release quotation:', err);
      setError(err.response?.data?.message || 'Failed to release quotation');
    } finally {
      setReleasing(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Quotation Details</span>
          {quotation && (
            <span className="font-mono" style={{ color: 'var(--primary-700)', fontSize: '15px' }}>
              ({quotation.quotationNo})
            </span>
          )}
        </div>
      }
      maxWidth="850px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
            {quotation && `Created by ${quotation.createdBy?.username || 'System'} on ${formatDate(quotation.createdAt)}`}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>

            {quotation && quotation.status !== 'released' && canEdit && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  if (onEdit) onEdit(quotation);
                }}
              >
                <Edit size={14} style={{ marginRight: '4px' }} /> Edit Quotation
              </Button>
            )}

            {quotation && quotation.status !== 'released' && canRelease && (
              <Button variant="outline" onClick={handleReleaseAction} disabled={releasing}>
                <CheckCircle2 size={14} style={{ marginRight: '4px' }} color="var(--success-600)" />
                {releasing ? 'Releasing...' : 'Release Quotation'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading quotation details...</div>
      ) : error ? (
        <Alert type="error" message={error} />
      ) : quotation ? (
        <div>
          {/* Header Summary Row */}
          <div
            style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--gray-100)',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                Quotation Status
              </div>
              <div style={{ marginTop: '2px' }}>
                <StatusBadge status={quotation.status} />
                {quotation.amendmentCount > 0 && (
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--primary-700)',
                    }}
                  >
                    (Amendment #{quotation.amendmentCount})
                  </span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                Quotation Date
              </div>
              <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                {formatDate(quotation.quotationDate)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                Type / Category
              </div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--gray-800)' }}>
                {quotation.quotationType} • {quotation.quotationCategory}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                Grand Total
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-700)' }}>
                ₹{(quotation.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Party & Requirement Context Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-700)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} /> Client / Party Details
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-900)' }}>
                {quotation.client?.companyName || 'N/A'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '2px' }} className="font-mono">
                Code: {quotation.client?.clientCode || '—'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Contact: {quotation.attentionPerson || quotation.client?.contactPerson || '—'}
              </div>
              {quotation.client?.city && (
                <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                  Location: {quotation.client.city}, {quotation.client.state}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-700)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} /> Requirement & Sales Context
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray-800)' }}>
                Requirement Ref: <strong className="font-mono">{quotation.requirement?.requirementNo || '—'}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Sales Person: {quotation.salesPerson?.fullName || '—'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Valid Till: {formatDate(quotation.validTill)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Currency: {quotation.currency || 'INR'}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '10px' }}>
              Quotation Line Items ({items.length})
            </h4>

            <div className="table-container">
              <table className="data-table" style={{ fontSize: '12.5px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Item Description</th>
                    <th>HSN</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th>UOM</th>
                    <th style={{ textAlign: 'right' }}>Unit Rate (₹)</th>
                    <th style={{ textAlign: 'right' }}>Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it._id || idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                          {it.item?.itemName || it.description}
                        </div>
                        {it.item?.itemCode && (
                          <div style={{ fontSize: '11px', color: 'var(--gray-500)' }} className="font-mono">
                            {it.item.itemCode}
                          </div>
                        )}
                        {it.remarks && (
                          <div style={{ fontSize: '11px', color: 'var(--gray-600)', fontStyle: 'italic' }}>
                            Note: {it.remarks}
                          </div>
                        )}
                      </td>
                      <td className="font-mono" style={{ fontSize: '11.5px' }}>{it.hsnCode || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{it.quantity}</td>
                      <td>{it.uom?.uomCode || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary-700)' }}>
                        ₹{(it.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        ₹{(it.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commercial Breakdown Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '8px' }}>
                Commercial Terms
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--gray-700)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Payment Terms:</strong> {quotation.paymentTerms || 'As per standard agreement'}</div>
                <div><strong>Delivery Terms:</strong> {quotation.deliveryTerms || 'FOB Ex-works'}</div>
                <div><strong>General Terms:</strong> {quotation.generalTerms || 'None specified'}</div>
                {quotation.remarks && <div><strong>Remarks:</strong> {quotation.remarks}</div>}
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                background: 'var(--gray-50)',
                border: '1px solid var(--gray-300)',
                borderRadius: '6px',
                fontSize: '12.5px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Subtotal:</span>
                <strong>₹{(quotation.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              {quotation.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--danger-700)' }}>
                  <span>Discount:</span>
                  <span>- ₹{quotation.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {quotation.pfAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>P&F Charges:</span>
                  <span>+ ₹{quotation.pfAmount.toFixed(2)}</span>
                </div>
              )}
              {quotation.freightAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Freight Charges:</span>
                  <span>+ ₹{quotation.freightAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderTop: '1px solid var(--gray-200)', paddingTop: '6px' }}>
                <span>Taxable Amount:</span>
                <strong>₹{(quotation.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--primary-700)' }}>
                <span>{quotation.taxName || 'Tax'} ({quotation.taxRate || 0}%):</span>
                <span>+ ₹{(quotation.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  marginTop: '8px',
                  borderTop: '2px solid var(--gray-400)',
                  paddingTop: '8px',
                  fontSize: '14px',
                }}
              >
                <strong>Grand Total:</strong>
                <strong style={{ color: 'var(--primary-700)' }}>
                  ₹{(quotation.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          {/* Linked Sales Order Card (if Converted / Completed) */}
          {quotation.salesOrder && (
            <div
              style={{
                padding: '14px',
                background: 'var(--success-50)',
                border: '1px solid var(--success-200)',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--success-800)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Linked Sales Order Reference
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success-900)', marginTop: '2px' }} className="font-mono">
                  {typeof quotation.salesOrder === 'object' ? quotation.salesOrder.salesOrderNo : quotation.salesOrder}
                </div>
                {quotation.convertedAt && (
                  <div style={{ fontSize: '12px', color: 'var(--success-700)', marginTop: '4px' }}>
                    Converted on {formatDate(quotation.convertedAt)} {quotation.convertedBy?.username ? `by ${quotation.convertedBy.username}` : ''}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--success-800)', textTransform: 'uppercase' }}>
                  Sales Order Status
                </div>
                <div style={{ marginTop: '2px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'var(--success-600)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '11px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {typeof quotation.salesOrder === 'object' ? quotation.salesOrder.status : 'CREATED'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Lost Outcome Detail Card (if Lost) */}
          {(quotation.status === 'lost' || quotation.lostReason) && (
            <div
              style={{
                padding: '14px',
                background: 'var(--danger-50)',
                border: '1px solid var(--danger-200)',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger-800)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Quotation Outcome: LOST
              </div>
              <div style={{ fontSize: '13px', color: 'var(--danger-900)', marginBottom: '4px' }}>
                <strong>Reason:</strong> {quotation.lostReason ? quotation.lostReason.replace(/_/g, ' ') : 'N/A'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--danger-900)', marginBottom: '6px' }}>
                <strong>Remarks:</strong> {quotation.lostRemarks || 'No remarks provided.'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--danger-700)' }}>
                Marked Lost on {formatDate(quotation.lostAt)} {quotation.lostBy?.username ? `by ${quotation.lostBy.username}` : ''}
              </div>
            </div>
          )}

          {/* Follow-up History Section */}
          {quotation.followUps && quotation.followUps.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '10px' }}>
                Follow-up History ({quotation.followUps.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {quotation.followUps.slice().reverse().map((fu, idx) => (
                  <div
                    key={fu._id || idx}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--gray-50)',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11.5px', color: 'var(--gray-600)' }}>
                      <span>Next Follow-up: <strong style={{ color: 'var(--primary-700)' }}>{formatDate(fu.followUpDate)}</strong></span>
                      <span>Recorded on {formatDate(fu.createdAt)} {fu.followUpBy?.username ? `by ${fu.followUpBy.username}` : ''}</span>
                    </div>
                    <div style={{ color: 'var(--gray-900)' }}>{fu.remarks}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Progression Audit Log */}
          {quotation.statusHistory && quotation.statusHistory.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '10px' }}>
                Status Audit Trail ({quotation.statusHistory.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {quotation.statusHistory.slice().reverse().map((sh, idx) => (
                  <div
                    key={sh._id || idx}
                    style={{
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--neutral-50)',
                      border: '1px solid var(--neutral-200)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={sh.status} />
                      {sh.remarks && <span style={{ color: 'var(--neutral-700)' }}>— {sh.remarks}</span>}
                    </div>
                    <div style={{ color: 'var(--neutral-500)', fontSize: '11px' }}>
                      {formatDate(sh.performedAt)} {sh.performedBy?.username ? `by ${sh.performedBy.username}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References & Traceability Section */}
          {references && references.amendments && references.amendments.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--gray-200)', paddingTop: '12px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '8px' }}>
                Amendment History ({references.amendments.length})
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                {references.amendments.map((am) => (
                  <div key={am._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--gray-100)', borderRadius: '4px' }}>
                    <span className="font-mono" style={{ fontWeight: 600 }}>{am.amendmentNo}</span>
                    <span>Reason: {am.reason}</span>
                    <span style={{ color: 'var(--gray-500)' }}>{formatDate(am.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};

export default QuotationDetailModal;
