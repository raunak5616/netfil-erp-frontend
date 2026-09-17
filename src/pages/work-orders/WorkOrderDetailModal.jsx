import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { getWorkOrderById } from '../../services/workOrderService';
import { useAuth } from '../../context/AuthContext';
import WorkOrderEditModal from './WorkOrderEditModal';
import WorkOrderActionModal from './WorkOrderActionModal';
import {
  Wrench,
  Building2,
  Calendar,
  UserCheck,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Layers,
  ArrowRight,
  PackageCheck
} from 'lucide-react';

const WorkOrderDetailModal = ({ isOpen, workOrderId, onClose, onWorkOrderUpdated }) => {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('WORK_ORDER_EDIT');
  const canRelease = hasPermission('WORK_ORDER_RELEASE');
  const canStart = hasPermission('WORK_ORDER_START');
  const canComplete = hasPermission('WORK_ORDER_COMPLETE');
  const canCancel = hasPermission('WORK_ORDER_CANCEL');

  const [workOrder, setWorkOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Child Modals State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionType, setActionType] = useState(null);

  const fetchDetail = async () => {
    if (!workOrderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getWorkOrderById(workOrderId);
      if (res.success) {
        setWorkOrder(res.workOrder);
        setItems(res.items || []);
      } else {
        setError(res.message || 'Failed to fetch Work Order detail');
      }
    } catch (err) {
      console.error('Fetch Work Order detail error:', err);
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && workOrderId) {
      fetchDetail();
    }
  }, [isOpen, workOrderId]);

  const handleOpenAction = (type) => {
    setActionType(type);
    setIsActionOpen(true);
  };

  const handleActionSuccess = () => {
    setIsActionOpen(false);
    setActionType(null);
    fetchDetail();
    if (onWorkOrderUpdated) onWorkOrderUpdated();
  };

  if (!isOpen) return null;

  const uomName = workOrder?.uom?.uomCode || workOrder?.uom?.uomName || 'Nos';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={workOrder ? `Work Order: ${workOrder.workOrderNo}` : 'Work Order Detail'}
        maxWidth="940px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* DRAFT Actions */}
              {canEdit && workOrder?.status === 'DRAFT' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Edit3 size={14} style={{ marginRight: '4px' }} /> Edit
                </Button>
              )}

              {canRelease && workOrder?.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenAction('RELEASE')}
                >
                  <ArrowRight size={14} style={{ marginRight: '4px' }} /> Release to Production
                </Button>
              )}

              {/* RELEASED Actions */}
              {canStart && workOrder?.status === 'RELEASED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenAction('START')}
                >
                  <Play size={14} style={{ marginRight: '4px' }} /> Start Production
                </Button>
              )}

              {/* IN_PROGRESS Actions */}
              {canComplete && workOrder?.status === 'IN_PROGRESS' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenAction('COMPLETE')}
                >
                  <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Complete Work Order
                </Button>
              )}

              {/* Cancel Action (DRAFT or RELEASED) */}
              {canCancel && ['DRAFT', 'RELEASED'].includes(workOrder?.status) && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleOpenAction('CANCEL')}
                >
                  <XCircle size={14} style={{ marginRight: '4px' }} /> Cancel Work Order
                </Button>
              )}
            </div>

            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--neutral-500)' }}>
            Loading Work Order details...
          </div>
        ) : !workOrder ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>No record found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* SECTION A — WORK ORDER INFORMATION CARD */}
            <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--neutral-900)' }} className="font-mono">
                      {workOrder.workOrderNo}
                    </span>
                    <StatusBadge status={workOrder.status} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '3px' }}>
                    Created on {new Date(workOrder.createdAt).toLocaleString('en-GB')} by <strong>{workOrder.createdBy?.username || 'System'}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700 }}>
                    Planned Production Quantity
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-700)' }}>
                    {workOrder.productionQuantity} {uomName}
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--neutral-200)' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700, display: 'block' }}>
                    Order BOM Reference
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }} className="font-mono">
                    {workOrder.orderBOM?.orderBOMCode || 'N/A'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }}>
                    Status: {workOrder.orderBOM?.status || '-'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700, display: 'block' }}>
                    Sales Order & Customer
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                    {workOrder.salesOrder?.salesOrderNo || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
                    {workOrder.salesOrder?.client?.companyName || workOrder.salesOrder?.client?.clientCode || 'N/A'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700, display: 'block' }}>
                    Parent Product
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                    {workOrder.parentItem?.itemName || 'N/A'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }} className="font-mono">
                    Code: {workOrder.parentItem?.itemCode || 'N/A'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700, display: 'block' }}>
                    Target Factory Plant
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-800)' }}>
                    {workOrder.plant?.plantName || workOrder.plant?.plantCode || 'Unassigned'}
                  </div>
                </div>
              </div>

              {/* Dates & Audit Timestamps Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--neutral-200)', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--neutral-500)' }}>Planned Schedule:</span>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-800)' }}>
                    {workOrder.plannedStartDate ? new Date(workOrder.plannedStartDate).toLocaleDateString('en-GB') : 'TBD'} → {workOrder.plannedEndDate ? new Date(workOrder.plannedEndDate).toLocaleDateString('en-GB') : 'TBD'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--neutral-500)' }}>Actual Schedule:</span>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-800)' }}>
                    {workOrder.actualStartDate ? new Date(workOrder.actualStartDate).toLocaleDateString('en-GB') : 'Not Started'} → {workOrder.actualEndDate ? new Date(workOrder.actualEndDate).toLocaleDateString('en-GB') : 'In Progress'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--neutral-500)' }}>Last Updated By:</span>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-800)' }}>
                    {workOrder.updatedBy?.username || 'System'} ({new Date(workOrder.updatedAt).toLocaleString('en-GB')})
                  </div>
                </div>
              </div>

              {workOrder.remarks && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--neutral-200)', fontSize: '12.5px', color: 'var(--neutral-700)' }}>
                  <strong>Remarks:</strong> {workOrder.remarks}
                </div>
              )}
            </div>

            {/* SECTION B — COMPONENT REQUIREMENTS TABLE */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                  Component Requirements & Material Issuance ({items.length})
                </h4>
                <span style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }}>
                  Component requirements derived from Order BOM for production quantity ({workOrder.productionQuantity} {uomName})
                </span>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Component Item</th>
                      <th style={{ textAlign: 'right' }}>Qty / Parent</th>
                      <th style={{ textAlign: 'right' }}>Required Qty</th>
                      <th style={{ textAlign: 'right' }}>Issued Qty</th>
                      <th style={{ textAlign: 'right' }}>Remaining Qty</th>
                      <th>UOM</th>
                      <th>Tag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '16px', color: 'var(--neutral-500)' }}>
                          No component items snapshotted in this Work Order
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => {
                        const reqQty = Number(item.requiredQuantity || 0);
                        const issQty = Number(item.issuedQuantity || 0);
                        const remQty = Math.max(0, Number((reqQty - issQty).toFixed(6)));
                        const isFullyIssued = issQty >= reqQty && reqQty > 0;

                        return (
                          <tr key={item._id || idx}>
                            <td>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                                {item.componentItem?.itemName || 'Component'}
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }} className="font-mono">
                                {item.componentItem?.itemCode || 'N/A'}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantityPerParent}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--neutral-900)' }}>
                              {reqQty}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: isFullyIssued ? 'var(--success-700)' : issQty > 0 ? 'var(--primary-700)' : 'var(--neutral-600)' }}>
                              {issQty}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: remQty > 0 ? 'var(--warning-700)' : 'var(--success-700)' }}>
                              {remQty}
                            </td>
                            <td>{item.uom?.uomCode || item.uom?.uomName || '-'}</td>
                            <td>{item.positionTag || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION C — STATUS HISTORY TIMELINE */}
            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '14px', background: '#fff' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} /> Status History Log
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                {(!workOrder.statusHistory || workOrder.statusHistory.length === 0) ? (
                  <div style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>No status history logged</div>
                ) : (
                  workOrder.statusHistory.map((h, idx) => (
                    <div key={idx} style={{ fontSize: '11.5px', borderLeft: '2px solid var(--primary-500)', paddingLeft: '8px', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <StatusBadge status={h.status} />
                        <span style={{ color: 'var(--neutral-500)', fontSize: '11px' }}>
                          {new Date(h.performedAt).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <div style={{ color: 'var(--neutral-700)', marginTop: '2px' }}>
                        By <strong>{h.performedBy?.username || 'User'}</strong> {h.remarks ? `— "${h.remarks}"` : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      {isEditOpen && workOrder && (
        <WorkOrderEditModal
          isOpen={isEditOpen}
          workOrder={workOrder}
          onClose={() => setIsEditOpen(false)}
          onSuccess={(updated) => {
            setIsEditOpen(false);
            fetchDetail();
            if (onWorkOrderUpdated) onWorkOrderUpdated();
          }}
        />
      )}

      {/* Action Modal */}
      {isActionOpen && actionType && (
        <WorkOrderActionModal
          isOpen={isActionOpen}
          actionType={actionType}
          workOrder={workOrder}
          onClose={() => {
            setIsActionOpen(false);
            setActionType(null);
          }}
          onSuccess={handleActionSuccess}
        />
      )}
    </>
  );
};

export default WorkOrderDetailModal;
