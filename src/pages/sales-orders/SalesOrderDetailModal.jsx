import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { getSalesOrderById, updateSalesOrderStatus, getSalesOrderReferences } from '../../services/salesOrderService';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Building2, 
  Calendar, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Edit, 
  Layers, 
  Package, 
  ExternalLink,
  ShieldCheck,
  Ban
} from 'lucide-react';

const SalesOrderDetailModal = ({ isOpen, salesOrderId, onClose, onEdit, onStatusUpdated }) => {
  const { hasPermission } = useAuth();
  const canConfirm = hasPermission('SALES_ORDER_CONFIRM');
  const canEdit = hasPermission('SALES_ORDER_EDIT');

  const [loading, setLoading] = useState(true);
  const [salesOrder, setSalesOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [references, setReferences] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'traceability'

  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDetails = async () => {
    if (!salesOrderId || !isOpen) return;
    setLoading(true);
    setError('');
    try {
      const [res, refRes] = await Promise.all([
        getSalesOrderById(salesOrderId),
        getSalesOrderReferences(salesOrderId).catch(() => ({ success: false }))
      ]);

      if (res.success && res.salesOrder) {
        setSalesOrder(res.salesOrder);
        setItems(res.items || []);
      } else {
        setError('Failed to load Sales Order details');
      }

      if (refRes.success && refRes.references) {
        setReferences(refRes.references);
      }
    } catch (err) {
      console.error('Error fetching sales order details:', err);
      setError(err.response?.data?.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [salesOrderId, isOpen]);

  const handleStatusTransition = async (targetStatus) => {
    if (!salesOrder) return;
    
    const confirmText = targetStatus === 'confirmed'
      ? `Are you sure you want to CONFIRM Sales Order "${salesOrder.salesOrderNo}"? This will lock commercial snapshot totals.`
      : targetStatus === 'cancelled'
      ? `Are you sure you want to CANCEL Sales Order "${salesOrder.salesOrderNo}"? This action cannot be undone.`
      : `Are you sure you want to change status to ${targetStatus.toUpperCase()}?`;

    if (!window.confirm(confirmText)) return;

    setStatusLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await updateSalesOrderStatus(salesOrderId, targetStatus);
      if (res.success) {
        setSuccessMsg(res.message || `Status updated to ${targetStatus}`);
        setSalesOrder(res.salesOrder);
        if (onStatusUpdated) onStatusUpdated();
      } else {
        setError(res.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status transition error:', err);
      setError(err.response?.data?.message || 'Failed to change status');
    } finally {
      setStatusLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={salesOrder ? `Sales Order — ${salesOrder.salesOrderNo}` : 'Sales Order Details'}
      size="xl"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--neutral-500)' }}>
          Loading Sales Order information...
        </div>
      ) : !salesOrder ? (
        <div style={{ padding: '20px', color: 'var(--danger-600)' }}>
          Sales Order record not found.
        </div>
      ) : (
        <div>
          {/* Header Card */}
          <div className="card" style={{ padding: '16px', marginBottom: '16px', background: '#f8fafc', borderLeft: '4px solid var(--primary-600)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--primary-800)' }} className="font-mono">
                    {salesOrder.salesOrderNo}
                  </h3>
                  <StatusBadge status={salesOrder.status} />
                  <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                    {salesOrder.orderType} / {salesOrder.orderCategory}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12.5px', color: 'var(--neutral-600)' }}>
                  <span>
                    <strong>Date:</strong> {salesOrder.salesOrderDate ? new Date(salesOrder.salesOrderDate).toLocaleDateString('en-GB') : '-'}
                  </span>
                  <span>
                    <strong>Party:</strong> {salesOrder.client?.companyName || 'N/A'} ({salesOrder.client?.clientCode || '-'})
                  </span>
                  <span>
                    <strong>Quotation Ref:</strong> <span className="font-mono">{salesOrder.quotation?.quotationNo || '-'}</span>
                  </span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {salesOrder.status === 'draft' && canConfirm && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusTransition('confirmed')}
                    disabled={statusLoading}
                  >
                    <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Confirm Order
                  </Button>
                )}

                {salesOrder.status === 'confirmed' && canConfirm && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusTransition('in_progress')}
                      disabled={statusLoading}
                    >
                      <Clock size={14} style={{ marginRight: '6px' }} /> Mark In Progress
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatusTransition('completed')}
                      disabled={statusLoading}
                    >
                      <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Mark Completed
                    </Button>
                  </>
                )}

                {salesOrder.status === 'in_progress' && canConfirm && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusTransition('completed')}
                    disabled={statusLoading}
                  >
                    <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Mark Completed
                  </Button>
                )}

                {['draft', 'confirmed', 'in_progress'].includes(salesOrder.status) && canConfirm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusTransition('cancelled')}
                    disabled={statusLoading}
                    style={{ color: 'var(--danger-600)' }}
                  >
                    <Ban size={14} style={{ marginRight: '4px' }} /> Cancel
                  </Button>
                )}

                {canEdit && salesOrder.status !== 'cancelled' && salesOrder.status !== 'completed' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      if (onEdit) onEdit(salesOrder);
                    }}
                  >
                    <Edit size={14} style={{ marginRight: '6px' }} /> Edit Order
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--neutral-200)', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'details' ? '2px solid var(--primary-600)' : 'none',
                fontWeight: activeTab === 'details' ? 600 : 400,
                color: activeTab === 'details' ? 'var(--primary-700)' : 'var(--neutral-600)',
                cursor: 'pointer'
              }}
            >
              Order & Commercial Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('traceability')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'traceability' ? '2px solid var(--primary-600)' : 'none',
                fontWeight: activeTab === 'traceability' ? 600 : 400,
                color: activeTab === 'traceability' ? 'var(--primary-700)' : 'var(--neutral-600)',
                cursor: 'pointer'
              }}
            >
              Traceability & References
            </button>
          </div>

          {/* TAB 1: ORDER & COMMERCIAL DETAILS */}
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Customer PO & Terms Card */}
              <div className="card" style={{ padding: '14px', background: 'white' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--neutral-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Customer PO & Delivery Terms
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <div style={{ color: 'var(--neutral-500)' }}>Customer PO No</div>
                    <strong style={{ color: 'var(--neutral-900)' }} className="font-mono">
                      {salesOrder.customerPoNumber || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--neutral-500)' }}>Customer PO Date</div>
                    <strong>{salesOrder.customerPoDate ? new Date(salesOrder.customerPoDate).toLocaleDateString('en-GB') : 'N/A'}</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--neutral-500)' }}>Expected Delivery Date</div>
                    <strong>{salesOrder.expectedDeliveryDate ? new Date(salesOrder.expectedDeliveryDate).toLocaleDateString('en-GB') : 'N/A'}</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--neutral-500)' }}>Sales Person</div>
                    <strong>{salesOrder.salesPerson?.fullName || 'Unassigned'}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px', fontSize: '12px', borderTop: '1px solid var(--neutral-100)', paddingTop: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--neutral-500)' }}>Payment Terms: </span>
                    <span>{salesOrder.paymentTerms || 'Standard'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--neutral-500)' }}>Delivery Terms: </span>
                    <span>{salesOrder.deliveryTerms || 'Standard'}</span>
                  </div>
                </div>

                {salesOrder.remarks && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--neutral-700)', background: 'var(--neutral-50)', padding: '6px 10px', borderRadius: '4px' }}>
                    <strong>Remarks: </strong> {salesOrder.remarks}
                  </div>
                )}
              </div>

              {/* Snapshotted Line Items Table */}
              <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--neutral-800)', textTransform: 'uppercase' }}>
                    Sales Order Items (Snapshot)
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>
                    Total Quantity: <strong>{salesOrder.totalQuantity || 0}</strong>
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--neutral-100)', textTransform: 'uppercase', fontSize: '10.5px', color: 'var(--neutral-600)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>#</th>
                      <th style={{ padding: '8px 12px' }}>Item / Description</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '8px 12px' }}>UOM</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price (₹)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: 'var(--neutral-500)' }}>
                          No line items attached to this Sales Order.
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => (
                        <tr key={it._id || idx} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--neutral-500)' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                              {it.description}
                            </div>
                            {it.item?.itemCode && (
                              <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }} className="font-mono">
                                Code: {it.item.itemCode} {it.hsnCode ? `| HSN: ${it.hsnCode}` : ''}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{it.quantity}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--neutral-600)' }}>
                            {typeof it.uom === 'object' ? it.uom?.unitSymbol || it.uom?.unitName : 'Units'}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            ₹{(it.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--neutral-900)' }}>
                            ₹{(it.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Commercial Breakdown Card */}
              <div className="card" style={{ padding: '16px', background: '#f8fafc', border: '1px solid var(--neutral-300)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--neutral-800)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Commercial Summary (Historical Snapshot)</span>
                  <span style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'none', fontWeight: 400 }}>
                    Currency: {salesOrder.currency || 'INR'}
                  </span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12.5px' }}>
                  <div style={{ background: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                    <span style={{ color: 'var(--neutral-500)', display: 'block', fontSize: '11px' }}>Subtotal</span>
                    <strong>₹{(salesOrder.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ background: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                    <span style={{ color: 'var(--neutral-500)', display: 'block', fontSize: '11px' }}>P&F Amount</span>
                    <strong>₹{(salesOrder.pfAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ background: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                    <span style={{ color: 'var(--neutral-500)', display: 'block', fontSize: '11px' }}>Freight Amount</span>
                    <strong>₹{(salesOrder.freightAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ background: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                    <span style={{ color: 'var(--neutral-500)', display: 'block', fontSize: '11px' }}>Discount Amount</span>
                    <strong>₹{(salesOrder.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ background: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                    <span style={{ color: 'var(--neutral-500)', display: 'block', fontSize: '11px' }}>Taxable Amount</span>
                    <strong>₹{(salesOrder.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ background: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--neutral-200)', gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--neutral-500)', display: 'block', fontSize: '11px' }}>
                      Tax ({salesOrder.taxName || 'GST'} @ {salesOrder.taxRate || 0}%)
                    </span>
                    <strong>₹{(salesOrder.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ background: 'var(--success-50)', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--success-200)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--success-800)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                      Grand Total
                    </span>
                    <strong style={{ fontSize: '16px', color: 'var(--success-800)' }}>
                      ₹{(salesOrder.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRACEABILITY & REFERENCES */}
          {activeTab === 'traceability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--neutral-800)' }}>
                  Document Flow & Origin Traceability
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  {/* Party Reference */}
                  <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '12px', background: 'white' }}>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      1. Party / Client Master
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--neutral-900)', fontSize: '14px' }}>
                      {references?.client?.companyName || salesOrder.client?.companyName || 'N/A'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--neutral-600)', marginTop: '4px' }} className="font-mono">
                      Code: {references?.client?.clientCode || salesOrder.client?.clientCode || '-'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '4px' }}>
                      Contact: {references?.client?.contactPerson || '-'}
                    </div>
                  </div>

                  {/* Requirement Reference */}
                  <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '12px', background: 'white' }}>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      2. Source Requirement / Enquiry
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary-700)', fontSize: '14px' }} className="font-mono">
                      {references?.requirement?.requirementNo || salesOrder.requirement?.requirementNo || 'N/A'}
                    </div>
                    {references?.requirement?.status && (
                      <div style={{ marginTop: '6px' }}>
                        <StatusBadge status={references.requirement.status} />
                      </div>
                    )}
                  </div>

                  {/* Quotation Reference */}
                  <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '12px', background: 'white' }}>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      3. Source Quotation
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary-700)', fontSize: '14px' }} className="font-mono">
                      {references?.quotation?.quotationNo || salesOrder.quotation?.quotationNo || 'N/A'}
                    </div>
                    {references?.quotation?.status && (
                      <div style={{ marginTop: '6px' }}>
                        <StatusBadge status={references.quotation.status} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--neutral-200)' }}>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SalesOrderDetailModal;
