import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { 
  useGetWorkOrderByIdQuery, 
  useGetWorkOrderAttachmentsQuery 
} from '../../features/workOrders/workOrdersApi';
import { useAuth } from '../../context/AuthContext';
import WorkOrderEditModal from './WorkOrderEditModal';
import WorkOrderActionModal from './WorkOrderActionModal';
import WorkOrderAttachmentsSection from './components/WorkOrderAttachmentsSection';
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
  FileText,
  ArrowRight,
  PackageCheck,
  Printer,
  Truck,
  CreditCard,
  Package
} from 'lucide-react';
import { printWorkOrderPdf } from '../../services/workOrderService';

const WorkOrderDetailModal = ({ isOpen, workOrderId, onClose, onWorkOrderUpdated, initialTab = 'overview' }) => {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('WORK_ORDER_EDIT');
  const canRelease = hasPermission('WORK_ORDER_RELEASE');
  const canStart = hasPermission('WORK_ORDER_START');
  const canComplete = hasPermission('WORK_ORDER_COMPLETE');
  const canCancel = hasPermission('WORK_ORDER_CANCEL');

  const [activeTab, setActiveTab] = useState(initialTab || 'overview');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'overview');
    }
  }, [isOpen, initialTab]);

  // Child Modals State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionType, setActionType] = useState(null);

  // RTK Query Hooks
  const {
    data: detailData,
    isLoading: loading,
    error: queryError,
    refetch: fetchDetail
  } = useGetWorkOrderByIdQuery(workOrderId, {
    skip: !isOpen || !workOrderId
  });

  const {
    data: attachmentsData,
    isLoading: attachmentsLoading,
    refetch: fetchAttachments
  } = useGetWorkOrderAttachmentsQuery(
    { id: workOrderId },
    { skip: !isOpen || !workOrderId }
  );

  const workOrder = detailData?.workOrder || null;
  const items = detailData?.items || [];
  const attachments = attachmentsData?.attachments || [];
  const error = queryError ? (queryError.data?.message || queryError.message || 'Error connecting to server') : '';

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
            <div className="flex gap-2">
              {workOrder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printWorkOrderPdf(workOrder._id, workOrder.workOrderNo)}
                  title="Download or Print Client-Format Work Order PDF"
                >
                  <Printer size={14} style={{ marginRight: '4px' }} /> Print Work Order PDF
                </Button>
              )}

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* TABS NAVIGATION */}
            <div className="flex border-b border-slate-200 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 px-1 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers size={14} />
                Overview & Component Requirements
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`pb-2.5 px-1 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'documents'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText size={14} />
                Documents & Invoices
                {attachments.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    {attachments.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: OVERVIEW & COMPONENTS / PRODUCTS */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {workOrder.source === 'SALES_ORDER' ? (
                  <>
                    {/* DIRECT SALES ORDER WORK ORDER CARD */}
                    <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }} className="font-mono">
                              {workOrder.workOrderNo}
                            </span>
                            <StatusBadge status={workOrder.status} />
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                              Direct Sales Order PO Flow
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Created on {new Date(workOrder.createdAt).toLocaleString('en-GB')} by <strong>{workOrder.createdBy?.username || 'System'}</strong>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                            Total Manufacturing Quantity
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1d4ed8' }}>
                            {workOrder.productionQuantity} {uomName}
                          </div>
                        </div>
                      </div>

                      {/* Header Info Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <div>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'block' }}>
                            Sales Order Reference
                          </span>
                          <div style={{ fontWeight: 600, color: '#0f172a' }} className="font-mono">
                            {workOrder.salesOrder?.salesOrderNo || 'N/A'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                            Status: {workOrder.salesOrder?.status || '—'}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'block' }}>
                            Customer PO Number
                          </span>
                          <div style={{ fontWeight: 700, color: '#1e3a8a' }} className="font-mono">
                            {workOrder.customerPoNumber || workOrder.salesOrder?.customerPoNumber || 'N/A'}
                          </div>
                          {workOrder.customerPoDate && (
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              PO Date: {new Date(workOrder.customerPoDate).toLocaleDateString('en-GB')}
                            </div>
                          )}
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'block' }}>
                            Dispatch Date
                          </span>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            {workOrder.dispatchDate ? new Date(workOrder.dispatchDate).toLocaleDateString('en-GB') : 'TBD'}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'block' }}>
                            Target Factory Plant
                          </span>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            {workOrder.plant?.plantName || workOrder.plant?.plantCode || 'Unassigned'}
                          </div>
                        </div>
                      </div>

                      {/* Schedule Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: '#64748b' }}>Planned Schedule:</span>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {workOrder.plannedStartDate ? new Date(workOrder.plannedStartDate).toLocaleDateString('en-GB') : 'TBD'} → {workOrder.plannedEndDate ? new Date(workOrder.plannedEndDate).toLocaleDateString('en-GB') : 'TBD'}
                          </div>
                        </div>

                        <div>
                          <span style={{ color: '#64748b' }}>Actual Schedule:</span>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {workOrder.actualStartDate ? new Date(workOrder.actualStartDate).toLocaleDateString('en-GB') : 'Not Started'} → {workOrder.actualEndDate ? new Date(workOrder.actualEndDate).toLocaleDateString('en-GB') : 'In Progress'}
                          </div>
                        </div>

                        <div>
                          <span style={{ color: '#64748b' }}>Last Updated By:</span>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {workOrder.updatedBy?.username || 'System'} ({new Date(workOrder.updatedAt).toLocaleString('en-GB')})
                          </div>
                        </div>
                      </div>

                      {workOrder.remarks && (
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '12.5px', color: '#334155' }}>
                          <strong>Remarks:</strong> {workOrder.remarks}
                        </div>
                      )}
                    </div>

                    {/* ADDRESSES (BILLING & DELIVERY) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                      {/* Billing Address Card */}
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                          <Building2 size={15} className="text-blue-600" />
                          <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Billing Address (Customer)
                          </h4>
                        </div>
                        <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#334155' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {workOrder.billingAddress?.customerName || workOrder.customerName || workOrder.salesOrder?.client?.companyName || '—'}
                          </div>
                          <div style={{ color: '#64748b', marginTop: '2px' }}>
                            {workOrder.billingAddress?.address || [workOrder.salesOrder?.client?.address, workOrder.salesOrder?.client?.city, workOrder.salesOrder?.client?.state, workOrder.salesOrder?.client?.pincode].filter(Boolean).join(', ') || '—'}
                          </div>
                          {workOrder.billingAddress?.contactPerson && (
                            <div style={{ marginTop: '4px' }}>
                              <span style={{ color: '#64748b' }}>Kind Attn:</span> <strong>{workOrder.billingAddress.contactPerson}</strong>
                            </div>
                          )}
                          {(workOrder.billingAddress?.contactNumber || workOrder.billingAddress?.email) && (
                            <div style={{ marginTop: '2px', color: '#64748b' }}>
                              {workOrder.billingAddress?.contactNumber && <span>Tel: {workOrder.billingAddress.contactNumber} </span>}
                              {workOrder.billingAddress?.email && <span>| Email: {workOrder.billingAddress.email}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delivery Address Card */}
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                          <Truck size={15} className="text-blue-600" />
                          <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Delivery Address (Consignee)
                          </h4>
                        </div>
                        <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#334155' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {workOrder.deliveryAddress?.customerName || workOrder.billingAddress?.customerName || '—'}
                          </div>
                          <div style={{ color: '#64748b', marginTop: '2px' }}>
                            {workOrder.deliveryAddress?.address || workOrder.billingAddress?.address || '—'}
                          </div>
                          {workOrder.deliveryAddress?.contactPerson && (
                            <div style={{ marginTop: '4px' }}>
                              <span style={{ color: '#64748b' }}>Contact:</span> <strong>{workOrder.deliveryAddress.contactPerson}</strong>
                            </div>
                          )}
                          {workOrder.deliveryAddress?.contactNumber && (
                            <div style={{ marginTop: '2px', color: '#64748b' }}>
                              Tel: {workOrder.deliveryAddress.contactNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* COMMERCIAL TERMS SECTION */}
                    {workOrder.commercialTerms && (
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                          <CreditCard size={15} className="text-blue-600" />
                          <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Commercial & Delivery Terms
                          </h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '12px' }}>
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>1. Payment Terms:</span>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {workOrder.commercialTerms.paymentTerms || '—'}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>2. Transport Terms:</span>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {workOrder.commercialTerms.transportTerms || '—'}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>3. Transport Charges:</span>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {workOrder.commercialTerms.transportCharges || '—'}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>4. Wooden Packing:</span>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {workOrder.commercialTerms.woodenPacking || '—'}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>5. Required Forms:</span>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {workOrder.commercialTerms.requiredForms || '—'}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>6. Marketing Executive:</span>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {workOrder.commercialTerms.marketingPerson?.name || '—'}
                              {workOrder.commercialTerms.marketingPerson?.contactNumber ? ` (${workOrder.commercialTerms.marketingPerson.contactNumber})` : ''}
                            </div>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>7. Freight Note:</span>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {workOrder.commercialTerms.freightNote || 'Freight payable at destination'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MANUFACTURED PRODUCTS TABLE */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Package size={15} className="text-blue-600" />
                          Manufactured Products & Specifications ({workOrder.items?.length || 0})
                        </h4>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Technical attributes & manufacturing quantities snapshotted from Sales Order
                        </span>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded bg-white">
                        <table className="w-full border-collapse text-left text-[12.5px] whitespace-nowrap">
                          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                              <th style={{ width: '36px', padding: '8px 10px' }}>#</th>
                              <th style={{ padding: '8px 10px' }}>Item / Grade</th>
                              <th style={{ padding: '8px 10px' }}>Efficiency [J]</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Dimensions (L × W × D) [A, B, C]</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Temp [G]</th>
                              <th style={{ padding: '8px 10px' }}>MOC [H]</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Flow [I]</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Ordered</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>WO Qty</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(!workOrder.items || workOrder.items.length === 0) ? (
                              <tr>
                                <td colSpan={10} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                                  No manufactured items found in this Work Order
                                </td>
                              </tr>
                            ) : (
                              workOrder.items.map((it, idx) => {
                                const dims = it.dimensions || {};
                                const length = dims.bodyWidth || dims.width || dims.length || it.length || '—';
                                const width = dims.bodyHeight || dims.height || it.width || '—';
                                const depth = dims.depth || dims.outerDiameter || it.depth || '—';
                                const dimStr = (length !== '—' && width !== '—' && depth !== '—')
                                  ? `${length} × ${width} × ${depth} mm`
                                  : [length, width, depth].filter(d => d !== '—').join(' × ') || '—';

                                return (
                                  <tr key={it._id || idx} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td style={{ padding: '8px 10px' }}>{idx + 1}</td>
                                    <td style={{ padding: '8px 10px' }}>
                                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                        {it.filterGrade || it.filterClass || it.itemName || '—'}
                                      </div>
                                      {(it.itemCode || it.description) && (
                                        <div style={{ fontSize: '11px', color: '#64748b' }} className="font-mono">
                                          {it.itemCode || it.description}
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: '8px 10px' }}>
                                      {it.efficiency || dims.efficiency || (it.micronRating ? `${it.micronRating}μ` : '—')}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }} className="font-mono text-xs">
                                      {dimStr}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                      {it.temperature || dims.temperature || '—'}
                                      {(it.temperature || dims.temperature) ? ' °C' : ''}
                                    </td>
                                    <td style={{ padding: '8px 10px' }}>
                                      {it.moc || dims.moc || dims.frameMaterial || '—'}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                      {it.flowDirection || dims.flowDirection || 'Standard'}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b' }}>
                                      {it.orderedQuantity ?? '—'}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#1d4ed8' }}>
                                      {it.productionQuantity}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                      {it.uomCode || it.uom?.uomCode || 'Nos'}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* LEGACY BOM WORK ORDER CARD */}
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

                      <div className="overflow-x-auto border border-slate-200 rounded bg-white">
                        <table className="w-full border-collapse text-left text-[13px] whitespace-nowrap">
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
                  </>
                )}

                {/* SECTION C — STATUS HISTORY TIMELINE */}
            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '14px', background: '#fff' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} /> Status History Log
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                {(!workOrder.statusHistory || workOrder.statusHistory.length === 0) ? (
                  <div className="text-xs text-slate-500">No status history logged</div>
                ) : (
                  workOrder.statusHistory.map((h, idx) => (
                    <div key={idx} style={{ fontSize: '11.5px', borderLeft: '2px solid var(--primary-500)', paddingLeft: '8px', marginBottom: '2px' }}>
                      <div className="flex justify-between items-center">
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

        {/* TAB 2: DOCUMENTS & INVOICES */}
        {activeTab === 'documents' && (
          <WorkOrderAttachmentsSection
            workOrderId={workOrderId}
            workOrderNo={workOrder.workOrderNo}
            attachments={attachments}
            loading={attachmentsLoading}
            canEdit={canEdit && workOrder.status !== 'CANCELLED'}
            onRefresh={fetchAttachments}
          />
        )}
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
