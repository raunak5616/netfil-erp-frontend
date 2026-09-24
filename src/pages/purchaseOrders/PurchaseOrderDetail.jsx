import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  getPurchaseOrderAmendments
} from '../../services/purchaseOrderService';
import { getItems } from '../../services/itemService';
import { getUOMs } from '../../services/uomService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/FormField';
import PurchaseOrderAmendmentModal from './PurchaseOrderAmendmentModal';
import PurchaseOrderAmendmentDetailModal from './PurchaseOrderAmendmentDetailModal';
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Play,
  FileEdit,
  Ban,
  Archive,
  Package,
  Building2,
  Calendar,
  History,
  FileText,
  DollarSign,
  UserCheck,
  Truck,
  Eye
} from 'lucide-react';

const PO_TYPE_LABELS = {
  GENERAL_PO: 'General PO',
  ADMIN_STATIONERY: 'Admin / Stationery',
  CAPITAL: 'Capital',
  CONSUMABLE: 'Consumable',
  EDD: 'EDD',
  OTHERS: 'Others',
  PACKING: 'Packing',
  LABOUR_SUBCONTRACT: 'Labour Subcontract',
  INSERT_TOOLS: 'Insert Tools',
  RAW_MATERIAL: 'Raw Material',
  SERVICE: 'Service',
  MAINTENANCE: 'Maintenance'
};

const STATUS_DISPLAY_MAP = {
  DRAFT: 'Draft',
  CHECKED: 'Checked',
  RELEASED: 'Released',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled'
};

const PurchaseOrderDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('PURCHASE_ORDER_EDIT');
  const canCheck = hasPermission('PURCHASE_ORDER_CHECK');
  const canRelease = hasPermission('PURCHASE_ORDER_RELEASE');
  const canClose = hasPermission('PURCHASE_ORDER_CLOSE');
  const canCancel = hasPermission('PURCHASE_ORDER_CANCEL');
  const canAmend = hasPermission('PURCHASE_ORDER_AMENDMENT_CREATE');
  const canViewAmendments = hasPermission('PURCHASE_ORDER_AMENDMENT_VIEW');

  const [po, setPo] = useState(null);
  const [amendments, setAmendments] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [uomsList, setUomsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Workflow Confirmation Modal State
  const [activeAction, setActiveAction] = useState(null); // 'CHECK', 'RELEASE', 'CLOSE', 'CANCEL'
  const [actionRemarks, setActionRemarks] = useState('');

  // Amendment Modals State
  const [isAmendmentCreateOpen, setIsAmendmentCreateOpen] = useState(false);
  const [selectedAmendment, setSelectedAmendment] = useState(null);
  const [isAmendmentDetailOpen, setIsAmendmentDetailOpen] = useState(false);

  const fetchPODetail = async () => {
    setLoading(true);
    setError('');
    try {
      const [poRes, itemRes, uomRes] = await Promise.all([
        getPurchaseOrderById(id),
        getItems().catch(() => ({ success: false, items: [] })),
        getUOMs().catch(() => ({ success: false, uoms: [] }))
      ]);

      if (poRes.success && poRes.purchaseOrder) {
        setPo(poRes.purchaseOrder);
      } else {
        setError('Purchase Order record not found.');
      }

      if (itemRes.success && Array.isArray(itemRes.items)) {
        setItemsList(itemRes.items.filter((i) => i.status === 'active'));
      }
      if (uomRes.success && Array.isArray(uomRes.uoms)) {
        setUomsList(uomRes.uoms.filter((u) => u.status === 'active'));
      }

      if (canViewAmendments) {
        fetchAmendments();
      }
    } catch (err) {
      console.error('Fetch PO Detail Error:', err);
      setError(err.response?.data?.message || 'Failed to fetch Purchase Order details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAmendments = async () => {
    try {
      const res = await getPurchaseOrderAmendments(id);
      if (res.success && Array.isArray(res.amendments)) {
        setAmendments(res.amendments);
      }
    } catch (err) {
      console.error('Fetch PO Amendments Error:', err);
    }
  };

  useEffect(() => {
    fetchPODetail();
  }, [id]);

  const handleExecuteAction = async () => {
    if (!activeAction || !po) return;

    setActionLoading(true);
    setError('');
    try {
      const res = await updatePurchaseOrderStatus(po._id, activeAction, actionRemarks.trim());
      if (res.success && res.purchaseOrder) {
        setSuccess(`Purchase Order status transitioned to '${STATUS_DISPLAY_MAP[res.purchaseOrder.status] || res.purchaseOrder.status}'`);
        setPo(res.purchaseOrder);
        setActiveAction(null);
        setActionRemarks('');
      } else {
        setError(res.message || 'Workflow transition failed.');
      }
    } catch (err) {
      console.error('PO Workflow transition error:', err);
      setError(err.response?.data?.message || 'Error executing workflow transition.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAmendmentSuccess = (newAmendment, updatedPO) => {
    setSuccess(`Amendment ${newAmendment.amendmentNo} issued successfully.`);
    setIsAmendmentCreateOpen(false);
    if (updatedPO) setPo(updatedPO);
    fetchAmendments();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-xs font-semibold">Loading Purchase Order details...</span>
      </div>
    );
  }

  if (error && !po) {
    return (
      <div className="space-y-4">
        <Alert type="danger" message={error} />
        <Button variant="secondary" size="sm" onClick={() => navigate('/purchase-orders')}>
          <ArrowLeft size={14} className="mr-1.5" /> Back to Purchase Orders
        </Button>
      </div>
    );
  }

  if (!po) return null;

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <PageHeader
        title={`Purchase Order: ${po.poNumber}`}
        subtitle={`Created on ${new Date(po.poDate).toLocaleDateString('en-GB')} by ${po.createdBy?.fullName || po.createdBy?.username || 'System'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/purchase-orders')}
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Back to Orders
            </Button>

            {canEdit && po.status === 'DRAFT' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/purchase-orders/${po._id}/edit`)}
              >
                <Edit size={14} className="mr-1.5" />
                Edit Draft PO
              </Button>
            )}
          </div>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* WORKFLOW ACTIONS BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Current Status:</span>
          <StatusBadge status={po.status} label={STATUS_DISPLAY_MAP[po.status] || po.status} />
          <span className="font-medium text-slate-700 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Type: {PO_TYPE_LABELS[po.poType] || po.poType}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* DRAFT ACTIONS */}
          {po.status === 'DRAFT' && (
            <>
              {canCheck && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveAction('CHECK');
                    setActionRemarks('Checked purchase order details');
                  }}
                >
                  <CheckCircle size={14} className="mr-1.5" /> Check Order
                </Button>
              )}
            </>
          )}

          {/* CHECKED ACTIONS */}
          {po.status === 'CHECKED' && (
            <>
              {canRelease && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveAction('RELEASE');
                    setActionRemarks('Released order to supplier');
                  }}
                >
                  <Play size={14} className="mr-1.5" /> Release Order
                </Button>
              )}
            </>
          )}

          {/* RELEASED ACTIONS */}
          {po.status === 'RELEASED' && (
            <>
              {canAmend && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAmendmentCreateOpen(true)}
                  className="text-purple-700 hover:bg-purple-50 border-purple-200"
                >
                  <FileEdit size={14} className="mr-1.5" /> Amend PO
                </Button>
              )}

              {canClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveAction('CLOSE');
                    setActionRemarks('Purchase order fulfilled and closed');
                  }}
                >
                  <Archive size={14} className="mr-1.5 text-slate-700" /> Close Order
                </Button>
              )}
            </>
          )}

          {/* CANCEL ACTION FOR NON-TERMINAL STATES */}
          {canCancel && !['CANCELLED', 'CLOSED'].includes(po.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveAction('CANCEL');
                setActionRemarks('');
              }}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              <Ban size={14} className="mr-1.5" /> Cancel Order
            </Button>
          )}

        </div>
      </div>

      {/* SUMMARY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Supplier Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck size={14} className="text-blue-600" /> Supplier (Party)
          </div>
          <div className="font-semibold text-sm text-slate-900">
            {po.supplierNameSnapshot || po.supplier?.companyName || '—'}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Code: <span className="text-slate-800">{po.supplierCodeSnapshot || po.supplier?.partyCode || 'N/A'}</span>
          </div>
        </div>

        {/* Department & References */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} className="text-blue-600" /> Dept & References
          </div>
          <div className="font-semibold text-xs text-slate-900">
            Dept: <span className="font-medium text-slate-800">{po.department?.departmentName || '—'}</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            PR: <span className="text-slate-800">{po.prNumberSnapshot || po.purchaseRequisition?.prNumber || 'None'}</span> | PE: <span className="text-slate-800">{po.enquiryNumberSnapshot || po.purchaseEnquiry?.enquiryNumber || 'None'}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} className="text-blue-600" /> Expected Delivery
          </div>
          <div className="font-semibold text-sm text-slate-900">
            {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-GB') : '—'}
          </div>
          <div className="text-xs text-slate-500">
            Location: <span className="font-medium text-slate-800">{po.deliveryLocation || 'Default Warehouse'}</span>
          </div>
        </div>

        {/* Buyer */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck size={14} className="text-blue-600" /> Commercial Buyer
          </div>
          <div className="font-semibold text-sm text-slate-900">
            {po.buyer?.fullName || po.buyer?.username || '—'}
          </div>
          <div className="text-xs text-slate-500">
            Currency: <span className="font-mono font-semibold text-slate-800">{po.currency || 'INR'}</span> (Ex: {po.exchangeRate || 1})
          </div>
        </div>

      </div>

      {/* TERMS & REMARKS CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <FileText size={16} className="text-blue-600" /> Payment & Delivery Terms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-500 block mb-1">Payment Terms:</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 min-h-[38px]">
              {po.paymentTerms || 'Standard terms'}
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block mb-1">Delivery Terms (Incoterms):</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 min-h-[38px]">
              {po.deliveryTerms || 'Standard terms'}
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block mb-1">Delivery Location:</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 min-h-[38px]">
              {po.deliveryLocation || 'Default warehouse'}
            </div>
          </div>
          <div className="md:col-span-3">
            <span className="font-semibold text-slate-500 block mb-1">Order Remarks & Special Instructions:</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 min-h-[38px]">
              {po.remarks || 'No general remarks.'}
            </div>
          </div>
        </div>
      </div>

      {/* LINE ITEMS SUMMARY TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <Package size={16} className="text-blue-600" /> Order Line Items ({po.items?.length || 0})
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                <th className="px-3 py-2.5 w-10 text-center">#</th>
                <th className="px-3 py-2.5 w-28">Item Code</th>
                <th className="px-3 py-2.5 min-w-[180px]">Item Description</th>
                <th className="px-3 py-2.5 w-24 text-right">Qty</th>
                <th className="px-3 py-2.5 w-20">UOM</th>
                <th className="px-3 py-2.5 w-24 text-right">Unit Rate</th>
                <th className="px-3 py-2.5 w-20 text-right">Discount</th>
                <th className="px-3 py-2.5 w-20 text-right">Tax %</th>
                <th className="px-3 py-2.5 w-24 text-right">Tax Amt</th>
                <th className="px-3 py-2.5 w-28 text-right">Line Amt</th>
                <th className="px-3 py-2.5 w-28">Req. Date</th>
                <th className="px-3 py-2.5 min-w-[120px]">Specs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(po.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-800">{item.itemCodeSnapshot || item.item?.itemCode || '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-900">{item.itemNameSnapshot || item.item?.itemName || '—'}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                    {(Number(item.quantity) || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-700">
                    {item.uomCodeSnapshot || item.uom?.uomCode || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    ₹ {(Number(item.unitRate) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-amber-700">
                    ₹ {(Number(item.discount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {Number(item.taxRate) || 0}%
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-sky-700">
                    ₹ {(Number(item.tax) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                    ₹ {(Number(item.lineAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {item.requiredDate ? new Date(item.requiredDate).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {item.specification || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FINANCIAL SUMMARY BREAKDOWN */}
      <div className="flex justify-end">
        <div className="w-full md:w-96 bg-slate-900 text-white rounded-xl p-5 shadow-lg space-y-2.5 font-mono text-xs">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-400" /> Authoritative Financial Totals
          </h4>
          <div className="flex justify-between text-slate-300">
            <span>Total Subtotal:</span>
            <span>₹ {(Number(po.subtotal) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-amber-400">
            <span>Total Discount:</span>
            <span>- ₹ {(Number(po.totalDiscount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sky-400">
            <span>Total Tax:</span>
            <span>+ ₹ {(Number(po.totalTax) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Freight Charges:</span>
            <span>+ ₹ {(Number(po.freight) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Other Charges:</span>
            <span>+ ₹ {(Number(po.otherCharges) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="border-t border-slate-700 pt-2 flex justify-between items-center text-sm font-bold text-white">
            <span>Grand Total:</span>
            <span className="text-emerald-400 text-base">₹ {(Number(po.grandTotal) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* AMENDMENTS HISTORY SECTION */}
      {canViewAmendments && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileEdit size={16} className="text-purple-600" /> PO Amendment History ({amendments.length})
            </h3>
            {canAmend && po.status === 'RELEASED' && (
              <Button variant="outline" size="xs" onClick={() => setIsAmendmentCreateOpen(true)} className="text-purple-700 border-purple-200">
                + Create Amendment
              </Button>
            )}
          </div>

          {amendments.length === 0 ? (
            <div className="text-xs text-slate-400 py-2">No amendments recorded for this Purchase Order.</div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="px-3 py-2.5 w-10 text-center">#</th>
                    <th className="px-3 py-2.5 w-36">Amendment No</th>
                    <th className="px-3 py-2.5 min-w-[200px]">Reason</th>
                    <th className="px-3 py-2.5 w-28">Status</th>
                    <th className="px-3 py-2.5 w-36">Issued By</th>
                    <th className="px-3 py-2.5 w-32">Date</th>
                    <th className="px-3 py-2.5 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {amendments.map((am, aIdx) => (
                    <tr key={am._id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 text-center text-slate-400">{aIdx + 1}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-purple-700">{am.amendmentNo}</td>
                      <td className="px-3 py-2.5 text-slate-800 font-medium">{am.reason}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={am.status || 'APPROVED'} />
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {am.createdBy?.fullName || am.createdBy?.username || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {am.createdAt ? new Date(am.createdAt).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setSelectedAmendment(am);
                            setIsAmendmentDetailOpen(true);
                          }}
                        >
                          <Eye size={13} className="mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* AUDIT HISTORY TIMELINE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <History size={16} className="text-blue-600" /> Audit Trail & Status History
        </h3>

        {(!po.statusHistory || po.statusHistory.length === 0) ? (
          <div className="text-xs text-slate-400 py-2">No history recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {po.statusHistory.map((hist, hIdx) => (
              <div key={hIdx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  {hIdx + 1}
                </div>
                <div className="flex-1 space-y-1 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900 uppercase tracking-wide">
                      {hist.action || 'ACTION'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {hist.performedAt ? new Date(hist.performedAt).toLocaleString('en-GB') : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={hist.status} label={STATUS_DISPLAY_MAP[hist.status] || hist.status} />
                    <span className="text-slate-600">
                      by <strong className="font-semibold text-slate-800">{hist.performedBy?.fullName || hist.performedBy?.username || 'User'}</strong>
                    </span>
                  </div>
                  {hist.remarks && (
                    <div className="text-slate-600 bg-white p-2 rounded border border-slate-200 mt-1 italic">
                      "{hist.remarks}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WORKFLOW ACTION CONFIRMATION MODAL */}
      {activeAction && (
        <Modal
          isOpen={!!activeAction}
          onClose={() => {
            setActiveAction(null);
            setActionRemarks('');
          }}
          title={`Confirm Action: ${activeAction}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Are you sure you want to execute <strong>{activeAction}</strong> on Purchase Order <code>{po.poNumber}</code>?
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Action Remarks / Reason {['CANCEL', 'CLOSE'].includes(activeAction) && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                placeholder="Enter remarks or justification for this status transition..."
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                rows={3}
                required={['CANCEL', 'CLOSE'].includes(activeAction)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setActiveAction(null);
                  setActionRemarks('');
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={activeAction === 'CANCEL' ? 'danger' : 'primary'}
                size="sm"
                onClick={handleExecuteAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : `Confirm ${activeAction}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* AMENDMENT CREATE MODAL */}
      {isAmendmentCreateOpen && (
        <PurchaseOrderAmendmentModal
          isOpen={isAmendmentCreateOpen}
          onClose={() => setIsAmendmentCreateOpen(false)}
          purchaseOrder={po}
          itemsList={itemsList}
          uomsList={uomsList}
          onSuccess={handleAmendmentSuccess}
        />
      )}

      {/* AMENDMENT DETAIL MODAL */}
      {isAmendmentDetailOpen && selectedAmendment && (
        <PurchaseOrderAmendmentDetailModal
          isOpen={isAmendmentDetailOpen}
          onClose={() => {
            setIsAmendmentDetailOpen(false);
            setSelectedAmendment(null);
          }}
          amendment={selectedAmendment}
        />
      )}

    </div>
  );
};

export default PurchaseOrderDetail;
