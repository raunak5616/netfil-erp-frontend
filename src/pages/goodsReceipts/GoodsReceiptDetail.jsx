import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getGoodsReceiptById,
  updateGoodsReceiptStatus,
  deleteGoodsReceipt
} from '../../services/goodsReceiptService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Textarea } from '../../components/ui/FormField';
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Ban,
  Package,
  Building2,
  Calendar,
  History,
  FileText,
  Truck,
  UserCheck,
  MapPin,
  Trash2
} from 'lucide-react';

const STATUS_DISPLAY_MAP = {
  DRAFT: 'Draft',
  POSTED: 'Posted',
  CANCELLED: 'Cancelled'
};

const GoodsReceiptDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('GOODS_RECEIPT_EDIT');
  const canPost = hasPermission('GOODS_RECEIPT_POST');
  const canCancel = hasPermission('GOODS_RECEIPT_CANCEL');

  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Workflow Confirmation Modal State ('POST' or 'CANCEL')
  const [activeAction, setActiveAction] = useState(null);
  const [actionRemarks, setActionRemarks] = useState('');

  // Delete Draft Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchGRNDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getGoodsReceiptById(id);
      if (res.success && res.goodsReceipt) {
        setGrn(res.goodsReceipt);
      } else {
        setError('Goods Receipt record not found.');
      }
    } catch (err) {
      console.error('Fetch GRN Detail Error:', err);
      setError(err.response?.data?.message || 'Failed to fetch Goods Receipt details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGRNDetail();
  }, [id]);

  const handleExecuteAction = async () => {
    if (!activeAction || !grn) return;

    setActionLoading(true);
    setError('');
    try {
      const res = await updateGoodsReceiptStatus(grn._id, activeAction, actionRemarks.trim());
      if (res.success && res.goodsReceipt) {
        setSuccess(`Goods Receipt status updated to '${STATUS_DISPLAY_MAP[res.goodsReceipt.status] || res.goodsReceipt.status}'`);
        setGrn(res.goodsReceipt);
        setActiveAction(null);
        setActionRemarks('');
      } else {
        setError(res.message || 'Workflow transition failed.');
      }
    } catch (err) {
      console.error('GRN Workflow transition error:', err);
      setError(err.response?.data?.message || 'Error executing workflow transition.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!grn) return;

    setActionLoading(true);
    setError('');
    try {
      const res = await deleteGoodsReceipt(grn._id);
      if (res.success) {
        setSuccess('Draft Goods Receipt deleted successfully.');
        setTimeout(() => navigate('/goods-receipts'), 800);
      } else {
        setError(res.message || 'Failed to delete draft Goods Receipt.');
      }
    } catch (err) {
      console.error('Delete GRN error:', err);
      setError(err.response?.data?.message || 'Error deleting Goods Receipt.');
    } finally {
      setActionLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-xs font-semibold">Loading Goods Receipt details...</span>
      </div>
    );
  }

  if (error && !grn) {
    return (
      <div className="space-y-4">
        <Alert type="danger" message={error} />
        <Button variant="secondary" size="sm" onClick={() => navigate('/goods-receipts')}>
          <ArrowLeft size={14} className="mr-1.5" /> Back to Goods Receipts
        </Button>
      </div>
    );
  }

  if (!grn) return null;

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <PageHeader
        title={`Goods Receipt Note: ${grn.grnNumber}`}
        subtitle={`Created on ${new Date(grn.grnDate).toLocaleDateString('en-GB')} by ${grn.createdBy?.fullName || grn.createdBy?.username || 'System'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/goods-receipts')}
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Back to List
            </Button>

            {canEdit && grn.status === 'DRAFT' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/goods-receipts/${grn._id}/edit`)}
              >
                <Edit size={14} className="mr-1.5" />
                Edit Draft GRN
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
          <StatusBadge status={grn.status} label={STATUS_DISPLAY_MAP[grn.status] || grn.status} />
          <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Challan No: {grn.supplierChallanNo}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* DRAFT POST ACTION */}
          {grn.status === 'DRAFT' && canPost && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveAction('POST');
                setActionRemarks('Posting material stock to warehouse bins');
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle size={14} className="mr-1.5" /> Post GRN to Stock
            </Button>
          )}

          {/* DRAFT DELETE ACTION */}
          {grn.status === 'DRAFT' && canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              <Trash2 size={14} className="mr-1.5" /> Delete Draft
            </Button>
          )}

          {/* POSTED CANCEL ACTION */}
          {grn.status === 'POSTED' && canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveAction('CANCEL');
                setActionRemarks('');
              }}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              <Ban size={14} className="mr-1.5" /> Cancel GRN
            </Button>
          )}

        </div>
      </div>

      {/* SUMMARY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Supplier & PO Reference */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck size={14} className="text-blue-600" /> Supplier & PO Reference
          </div>
          <div className="font-semibold text-sm text-slate-900">
            {grn.supplierNameSnapshot || grn.supplier?.companyName || '—'}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            PO Ref: <button
              type="button"
              onClick={() => {
                const poId = typeof grn.purchaseOrder === 'object' ? grn.purchaseOrder?._id : grn.purchaseOrder;
                if (poId) navigate(`/purchase-orders/${poId}`);
              }}
              className="text-blue-600 hover:underline font-bold"
            >
              {grn.poNumberSnapshot || grn.purchaseOrder?.poNumber || '—'}
            </button>
          </div>
        </div>

        {/* Challan & Gate Entry */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={14} className="text-blue-600" /> Supplier Challan & Gate Entry
          </div>
          <div className="font-semibold text-xs text-slate-900 font-mono">
            Challan No: <span className="text-slate-800">{grn.supplierChallanNo}</span>
          </div>
          <div className="text-xs text-slate-500">
            Date: <span className="font-medium text-slate-800">{grn.supplierChallanDate ? new Date(grn.supplierChallanDate).toLocaleDateString('en-GB') : '—'}</span> | Gate: <span className="font-mono text-slate-800">{grn.gateEntryNo || 'N/A'}</span>
          </div>
        </div>

        {/* Delivery & Logistics */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Truck size={14} className="text-blue-600" /> Logistics & Vehicle
          </div>
          <div className="font-semibold text-xs text-slate-900">
            Transporter: <span className="font-medium text-slate-800">{grn.transporterName || '—'}</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Vehicle: <span className="text-slate-800">{grn.vehicleNo || 'N/A'}</span> | LR: <span className="text-slate-800">{grn.lrNo || 'N/A'}</span>
          </div>
        </div>

        {/* Destination Location */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} className="text-blue-600" /> Destination Location
          </div>
          <div className="font-semibold text-xs text-slate-900">
            Plant: <span className="font-medium text-slate-800">{grn.plant?.plantName || grn.plant?.plantCode || '—'}</span>
          </div>
          <div className="text-xs text-slate-500">
            Store: <span className="font-medium text-slate-800">{grn.store?.storeName || grn.store?.storeCode || '—'}</span>
          </div>
        </div>

      </div>

      {/* LINE ITEMS & STORAGE BIN ALLOCATION TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <Package size={16} className="text-blue-600" /> Inward Received Line Items ({grn.items?.length || 0})
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                <th className="px-3 py-2.5 w-10 text-center">#</th>
                <th className="px-3 py-2.5 w-28">Item Code</th>
                <th className="px-3 py-2.5 min-w-[180px]">Item Description</th>
                <th className="px-3 py-2.5 w-24 text-right">PO Qty</th>
                <th className="px-3 py-2.5 w-24 text-right">Received Qty</th>
                <th className="px-3 py-2.5 w-24 text-right">Accepted Qty</th>
                <th className="px-3 py-2.5 w-24 text-right">Rejected Qty</th>
                <th className="px-3 py-2.5 w-20">UOM</th>
                <th className="px-3 py-2.5 min-w-[120px]">Storage Location</th>
                <th className="px-3 py-2.5 min-w-[100px]">Bin</th>
                <th className="px-3 py-2.5 min-w-[120px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(grn.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-800">{item.itemCodeSnapshot || item.item?.itemCode || '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-900">{item.itemNameSnapshot || item.item?.itemName || '—'}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                    {(Number(item.poQuantity) || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700">
                    {(Number(item.receivedQuantity) || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-700 font-semibold">
                    {(Number(item.acceptedQuantity) || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-red-600">
                    {(Number(item.rejectedQuantity) || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-700">
                    {item.uomCodeSnapshot || item.uom?.uomCode || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-800 font-medium">
                    {item.storageLocation?.locationName || item.storageLocation?.locationCode || '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-800 font-bold">
                    {item.bin?.binCode || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 italic">
                    {item.remarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <div className="bg-slate-900 text-white font-mono text-xs px-4 py-2.5 rounded-lg flex items-center gap-4">
            <span className="text-slate-400 uppercase tracking-wider text-[11px]">Total Received Quantity:</span>
            <span className="text-emerald-400 font-bold text-base">
              {(Number(grn.totalReceivedQuantity) || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* AUDIT HISTORY TIMELINE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <History size={16} className="text-blue-600" /> Audit Trail & Posting Log
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Created By:</span>
            <span className="font-semibold text-slate-800">
              {grn.createdBy?.fullName || grn.createdBy?.username || 'System'}
            </span>
            <span className="text-[11px] text-slate-500 block font-mono">
              {grn.createdAt ? new Date(grn.createdAt).toLocaleString('en-GB') : '—'}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
            <span className="text-emerald-800 block text-[11px] font-semibold">Posted By:</span>
            <span className="font-bold text-emerald-900">
              {grn.postedBy ? (grn.postedBy.fullName || grn.postedBy.username) : 'Not Posted Yet'}
            </span>
            <span className="text-[11px] text-emerald-700 block font-mono">
              {grn.postedAt ? new Date(grn.postedAt).toLocaleString('en-GB') : '—'}
            </span>
          </div>

          {grn.status === 'CANCELLED' && (
            <div className="p-3 bg-red-50/60 rounded-lg border border-red-200">
              <span className="text-red-800 block text-[11px] font-semibold">Cancelled By:</span>
              <span className="font-bold text-red-900">
                {grn.cancelledBy ? (grn.cancelledBy.fullName || grn.cancelledBy.username) : 'User'}
              </span>
              <span className="text-[11px] text-red-700 block font-mono">
                {grn.cancelledAt ? new Date(grn.cancelledAt).toLocaleString('en-GB') : '—'}
              </span>
              {grn.cancellationRemarks && (
                <div className="text-[11px] text-red-800 italic mt-1">"{grn.cancellationRemarks}"</div>
              )}
            </div>
          )}
        </div>

        {(!grn.statusHistory || grn.statusHistory.length === 0) ? (
          <div className="text-xs text-slate-400 py-2">No audit timeline recorded.</div>
        ) : (
          <div className="space-y-3">
            {grn.statusHistory.map((hist, hIdx) => (
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
          title={activeAction === 'POST' ? 'Confirm POST Goods Receipt' : 'Confirm Cancel Goods Receipt'}
        >
          <div className="space-y-4">
            {activeAction === 'POST' ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-emerald-800 text-sm">
                  <CheckCircle size={16} /> Post Material to Warehouse Stock
                </p>
                <p>Posting GRN <code>{grn.grnNumber}</code> will execute the following backend inventory operations:</p>
                <ul className="list-disc pl-4 space-y-1 text-emerald-800">
                  <li>Increase <strong>InventoryStock</strong> quantities at assigned storage bins.</li>
                  <li>Record audit <strong>StockTransaction</strong> entries for each line item.</li>
                  <li>Update Purchase Order fulfillment status (and automatically close PO if fully received).</li>
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Are you sure you want to <strong>CANCEL</strong> Goods Receipt <code>{grn.grnNumber}</code>?
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Action Remarks / Reason {activeAction === 'CANCEL' && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                placeholder="Enter remarks or justification..."
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                rows={3}
                required={activeAction === 'CANCEL'}
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
                className={activeAction === 'POST' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {actionLoading ? 'Processing...' : activeAction === 'POST' ? 'Confirm Post to Stock' : 'Confirm Cancel GRN'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION DIALOG FOR DELETE DRAFT */}
      {isDeleteDialogOpen && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title="Delete Draft Goods Receipt"
          message={`Are you sure you want to permanently delete draft Goods Receipt "${grn.grnNumber}"? This action cannot be undone.`}
          confirmLabel="Delete Draft GRN"
          variant="danger"
          loading={actionLoading}
          onConfirm={handleDeleteDraft}
          onCancel={() => setIsDeleteDialogOpen(false)}
        />
      )}

    </div>
  );
};

export default GoodsReceiptDetail;
