import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { getOrderBOMById } from '../../services/orderBomService';
import { useAuth } from '../../context/AuthContext';
import OrderBOMRouteModal from './OrderBOMRouteModal';
import {
  FileText,
  Package,
  Layers,
  Building2,
  Calendar,
  UserCheck,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  ShieldCheck,
  History,
  Wrench
} from 'lucide-react';

const OrderBOMDetailModal = ({ isOpen, orderBOMId, onClose, onOrderBOMUpdated }) => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canRouteStore = hasPermission('ORDER_BOM_ROUTE_STORE');
  const canRouteFactory = hasPermission('ORDER_BOM_ROUTE_FACTORY');
  const canEdit = hasPermission('ORDER_BOM_EDIT');
  const canCreateWorkOrder = hasPermission('WORK_ORDER_CREATE');

  const [orderBOM, setOrderBOM] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Routing Modal state
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeActionType, setRouteActionType] = useState(null);

  const fetchDetail = async () => {
    if (!orderBOMId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getOrderBOMById(orderBOMId);
      if (res.success) {
        setOrderBOM(res.orderBOM);
        setItems(res.items || []);
      } else {
        setError(res.message || 'Failed to fetch Order BOM detail');
      }
    } catch (err) {
      console.error('Fetch Order BOM Detail error:', err);
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderBOMId) {
      fetchDetail();
    }
  }, [isOpen, orderBOMId]);

  const handleRouteAction = (actionType) => {
    setRouteActionType(actionType);
    setRouteModalOpen(true);
  };

  const handleRouteSuccess = () => {
    setRouteModalOpen(false);
    setRouteActionType(null);
    fetchDetail();
    if (onOrderBOMUpdated) onOrderBOMUpdated();
  };

  if (!isOpen) return null;

  const uomName = orderBOM?.uom?.uomCode || orderBOM?.uom?.uomName || 'Nos';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={orderBOM ? `Order BOM: ${orderBOM.orderBOMCode}` : 'Order BOM Detail'}
        maxWidth="920px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Store Actions */}
              {canRouteStore && orderBOM?.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRouteAction('SEND_TO_STORE')}
                >
                  <Send size={14} style={{ marginRight: '4px' }} /> Send to Store
                </Button>
              )}

              {canRouteStore && orderBOM?.status === 'SENT_TO_STORE' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRouteAction('RECEIVE_BY_STORE')}
                >
                  <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Receive in Store
                </Button>
              )}

              {/* Factory Actions */}
              {canRouteFactory && orderBOM?.status === 'RECEIVED_BY_STORE' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRouteAction('SEND_TO_FACTORY')}
                >
                  <Send size={14} style={{ marginRight: '4px' }} /> Send to Factory
                </Button>
              )}

              {canRouteFactory && orderBOM?.status === 'SENT_TO_FACTORY' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRouteAction('RECEIVE_BY_FACTORY')}
                >
                  <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Receive in Factory
                </Button>
              )}

              {/* Create Work Order Action */}
              {canCreateWorkOrder && orderBOM?.status === 'RECEIVED_BY_FACTORY' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    navigate('/work-orders', { state: { createFromOrderBOM: orderBOM } });
                  }}
                >
                  <Wrench size={14} style={{ marginRight: '4px' }} /> Create Work Order
                </Button>
              )}

              {/* Cancel Action (Only allowed from DRAFT, SENT_TO_STORE, RECEIVED_BY_STORE) */}
              {canEdit && ['DRAFT', 'SENT_TO_STORE', 'RECEIVED_BY_STORE'].includes(orderBOM?.status) && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRouteAction('CANCEL')}
                >
                  <XCircle size={14} style={{ marginRight: '4px' }} /> Cancel Order BOM
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
            Loading Order BOM details...
          </div>
        ) : !orderBOM ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>No record found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Snapshot Visualization Callout Banner */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="#2563eb" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: '#334155' }}>
                <strong>HISTORICAL ORDER BOM SNAPSHOT:</strong> Created from <strong>Master BOM Version {orderBOM.masterBOMVersion || 1}</strong> ({orderBOM.masterBOM?.bomCode || 'Master BOM'}).
                This Order BOM is historically isolated; subsequent changes to the Master BOM will not alter this snapshot.
              </div>
            </div>

            {/* Header Metadata Card */}
            <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--neutral-900)' }} className="font-mono">
                      {orderBOM.orderBOMCode}
                    </span>
                    <StatusBadge status={orderBOM.status} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '2px' }}>
                    Created on {new Date(orderBOM.createdAt).toLocaleString('en-GB')} by <strong>{orderBOM.createdBy?.username || 'System User'}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700 }}>
                    Order Quantity & UOM
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-700)' }}>
                    {orderBOM.orderQuantity} {uomName}
                  </div>
                </div>
              </div>

              {/* Grid of Key Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--neutral-200)' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700, display: 'block' }}>
                    Sales Order & Party
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                    {orderBOM.salesOrder?.salesOrderNo || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
                    {orderBOM.salesOrder?.client?.companyName || orderBOM.salesOrder?.client?.clientCode || 'N/A'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700, display: 'block' }}>
                    Parent Finished Item
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                    {orderBOM.parentItem?.itemName || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--neutral-500)' }} className="font-mono">
                    Code: {orderBOM.parentItem?.itemCode || 'N/A'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700, display: 'block' }}>
                    Master BOM Source
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                    {orderBOM.masterBOM?.bomCode || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
                    Version: <span className="font-mono">v{orderBOM.masterBOMVersion || 1}</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700, display: 'block' }}>
                    Locations (Store / Factory)
                  </span>
                  <div style={{ fontSize: '12px', color: 'var(--neutral-800)' }}>
                    Store: <strong>{orderBOM.store?.storeName || orderBOM.store?.storeCode || 'Unassigned'}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--neutral-800)' }}>
                    Factory: <strong>{orderBOM.plant?.plantName || orderBOM.plant?.plantCode || 'Unassigned'}</strong>
                  </div>
                </div>
              </div>

              {orderBOM.remarks && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--neutral-200)', fontSize: '12.5px', color: 'var(--neutral-700)' }}>
                  <strong>Remarks:</strong> {orderBOM.remarks}
                </div>
              )}
            </div>

            {/* Snapshotted Component Items Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                  Component Items Snapshot ({items.length})
                </h4>
                <span style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }}>
                  Calculated required quantities for order quantity ({orderBOM.orderQuantity} {uomName})
                </span>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Component Item</th>
                      <th style={{ textAlign: 'right' }}>Qty / Parent</th>
                      <th style={{ textAlign: 'right' }}>Total Required Qty</th>
                      <th>UOM</th>
                      <th>Position Tag</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--neutral-500)' }}>
                          No component items snapshotted in this Order BOM
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={item._id || idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                              {item.componentItem?.itemName || 'Component Item'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }} className="font-mono">
                              {item.componentItem?.itemCode || 'N/A'}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantityPerParent}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-700)' }}>
                            {item.totalRequiredQuantity}
                          </td>
                          <td>{item.uom?.uomCode || item.uom?.uomName || '-'}</td>
                          <td>{item.positionTag || '-'}</td>
                          <td style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>{item.remarks || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Document Handover Audit Trail & Status History */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Handover Timestamps */}
              <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '14px', background: '#fff' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={15} /> Handover Audit Trail
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--neutral-100)' }}>
                    <span style={{ color: 'var(--neutral-500)' }}>Store Sent:</span>
                    <span style={{ fontWeight: 600 }}>
                      {orderBOM.storeSentAt ? `${new Date(orderBOM.storeSentAt).toLocaleString('en-GB')} (${orderBOM.storeSentBy?.username || 'User'})` : 'Pending'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--neutral-100)' }}>
                    <span style={{ color: 'var(--neutral-500)' }}>Store Received:</span>
                    <span style={{ fontWeight: 600 }}>
                      {orderBOM.storeReceivedAt ? `${new Date(orderBOM.storeReceivedAt).toLocaleString('en-GB')} (${orderBOM.storeReceivedBy?.username || 'User'})` : 'Pending'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--neutral-100)' }}>
                    <span style={{ color: 'var(--neutral-500)' }}>Factory Sent:</span>
                    <span style={{ fontWeight: 600 }}>
                      {orderBOM.factorySentAt ? `${new Date(orderBOM.factorySentAt).toLocaleString('en-GB')} (${orderBOM.factorySentBy?.username || 'User'})` : 'Pending'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--neutral-500)' }}>Factory Received:</span>
                    <span style={{ fontWeight: 600 }}>
                      {orderBOM.factoryReceivedAt ? `${new Date(orderBOM.factoryReceivedAt).toLocaleString('en-GB')} (${orderBOM.factoryReceivedBy?.username || 'User'})` : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status History */}
              <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '14px', background: '#fff' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} /> Status History Timeline
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {(!orderBOM.statusHistory || orderBOM.statusHistory.length === 0) ? (
                    <div style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>No status history logged</div>
                  ) : (
                    orderBOM.statusHistory.map((h, idx) => (
                      <div key={idx} style={{ fontSize: '11.5px', borderLeft: '2px solid var(--primary-500)', paddingLeft: '8px', marginBottom: '4px' }}>
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
          </div>
        )}
      </Modal>

      {/* Routing Action Modal */}
      {routeModalOpen && (
        <OrderBOMRouteModal
          isOpen={routeModalOpen}
          actionType={routeActionType}
          orderBOM={orderBOM}
          onClose={() => setRouteModalOpen(false)}
          onSuccess={handleRouteSuccess}
        />
      )}
    </>
  );
};

export default OrderBOMDetailModal;
