import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPurchaseRequisitionById,
  updatePurchaseRequisitionStatus
} from '../../services/purchaseRequisitionService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/FormField';
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Archive,
  Package,
  Building2,
  Calendar,
  History,
  FileText,
  User,
  ShieldCheck
} from 'lucide-react';

const PurchaseRequisitionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('PURCHASE_REQUISITION_EDIT');
  const canApprove = hasPermission('PURCHASE_REQUISITION_APPROVE');
  const canCancel = hasPermission('PURCHASE_REQUISITION_CANCEL');

  const [pr, setPr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Workflow Confirmation Modal State
  const [activeAction, setActiveAction] = useState(null); // 'SUBMIT', 'REVIEW', 'APPROVE', 'REJECT', 'CANCEL', 'CLOSE'
  const [actionRemarks, setActionRemarks] = useState('');

  const fetchPRDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPurchaseRequisitionById(id);
      if (res.success && res.purchaseRequisition) {
        setPr(res.purchaseRequisition);
      } else {
        setError('Purchase Requisition record not found.');
      }
    } catch (err) {
      console.error('Fetch PR Detail Error:', err);
      setError(err.response?.data?.message || 'Failed to fetch Purchase Requisition details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPRDetail();
  }, [id]);

  const handleExecuteAction = async () => {
    if (!activeAction || !pr) return;

    if (['REJECT', 'CANCEL', 'CLOSE'].includes(activeAction) && !actionRemarks.trim()) {
      setError(`Remarks/Reason is required when performing '${activeAction}' action.`);
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      const res = await updatePurchaseRequisitionStatus(pr._id, activeAction, actionRemarks.trim());
      if (res.success && res.purchaseRequisition) {
        setSuccess(`Purchase Requisition status transitioned to '${res.purchaseRequisition.status}'`);
        setPr(res.purchaseRequisition);
        setActiveAction(null);
        setActionRemarks('');
      } else {
        setError(res.message || 'Workflow transition failed.');
      }
    } catch (err) {
      console.error('Workflow transition error:', err);
      setError(err.response?.data?.message || 'Error executing workflow transition.');
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'LOW':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-xs font-semibold">Loading Purchase Requisition details...</span>
      </div>
    );
  }

  if (error && !pr) {
    return (
      <div className="space-y-4">
        <Alert type="danger" message={error} />
        <Button variant="secondary" size="sm" onClick={() => navigate('/purchase-requisitions')}>
          <ArrowLeft size={14} className="mr-1.5" /> Back to Requisitions
        </Button>
      </div>
    );
  }

  if (!pr) return null;

  const totalRequestedQty = (pr.items || []).reduce(
    (sum, item) => sum + (Number(item.requestedQuantity) || 0),
    0
  );

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <PageHeader
        title={`Purchase Requisition: ${pr.prNumber}`}
        subtitle={`Created on ${new Date(pr.prDate).toLocaleDateString('en-GB')} by ${pr.createdBy?.fullName || pr.createdBy?.username || 'System'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/purchase-requisitions')}
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Back to Requisitions
            </Button>

            {canEdit && pr.status === 'DRAFT' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/purchase-requisitions/${pr._id}/edit`)}
              >
                <Edit size={14} className="mr-1.5" />
                Edit Draft PR
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
          <StatusBadge status={pr.status} />
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase border ${getPriorityBadgeClass(pr.priority)}`}>
            {pr.priority || 'MEDIUM'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* DRAFT ACTIONS */}
          {pr.status === 'DRAFT' && canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveAction('SUBMIT');
                setActionRemarks('Submitted for approval review');
              }}
            >
              <Send size={14} className="mr-1.5" /> Submit Requisition
            </Button>
          )}

          {/* SUBMITTED ACTIONS */}
          {pr.status === 'SUBMITTED' && (
            <>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveAction('REVIEW');
                    setActionRemarks('Placed under department review');
                  }}
                >
                  <Clock size={14} className="mr-1.5 text-amber-600" /> Put Under Review
                </Button>
              )}
              {canApprove && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveAction('APPROVE');
                    setActionRemarks('Approved for procurement processing');
                  }}
                >
                  <CheckCircle2 size={14} className="mr-1.5" /> Approve
                </Button>
              )}
              {(canApprove || canEdit) && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setActiveAction('REJECT');
                    setActionRemarks('');
                  }}
                >
                  <XCircle size={14} className="mr-1.5" /> Reject
                </Button>
              )}
            </>
          )}

          {/* UNDER_REVIEW ACTIONS */}
          {pr.status === 'UNDER_REVIEW' && (
            <>
              {canApprove && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveAction('APPROVE');
                    setActionRemarks('Approved after departmental review');
                  }}
                >
                  <CheckCircle2 size={14} className="mr-1.5" /> Approve
                </Button>
              )}
              {(canApprove || canEdit) && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setActiveAction('REJECT');
                    setActionRemarks('');
                  }}
                >
                  <XCircle size={14} className="mr-1.5" /> Reject
                </Button>
              )}
            </>
          )}

          {/* APPROVED ACTIONS */}
          {pr.status === 'APPROVED' && (
            <>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveAction('CLOSE');
                    setActionRemarks('Purchase order fulfilled and requisition closed');
                  }}
                >
                  <Archive size={14} className="mr-1.5 text-slate-700" /> Close Requisition
                </Button>
              )}
            </>
          )}

          {/* CANCEL ACTION FOR NON-TERMINAL STATES */}
          {canCancel && !['CANCELLED', 'CLOSED'].includes(pr.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveAction('CANCEL');
                setActionRemarks('');
              }}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              <Ban size={14} className="mr-1.5" /> Cancel Requisition
            </Button>
          )}
        </div>
      </div>

      {/* SUMMARY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Requester & Dept */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <User size={14} className="text-blue-600" /> Requester & Department
          </div>
          <div className="font-semibold text-sm text-slate-900">
            {pr.requestingEmployee?.fullName || pr.requestingEmployee?.employeeCode || '—'}
          </div>
          <div className="text-xs text-slate-500">
            Dept: <span className="font-medium text-slate-800">{pr.department?.departmentName || '—'}</span>
          </div>
        </div>

        {/* Priority & Required Date */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} className="text-blue-600" /> Priority & Target Date
          </div>
          <div className="font-semibold text-sm text-slate-900">
            Required: {pr.requiredDate ? new Date(pr.requiredDate).toLocaleDateString('en-GB') : '—'}
          </div>
          <div className="text-xs text-slate-500">
            Priority Level: <span className="font-semibold text-slate-800">{pr.priority || 'MEDIUM'}</span>
          </div>
        </div>

        {/* Reference Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={14} className="text-blue-600" /> Source Reference
          </div>
          <div className="font-semibold text-sm text-slate-900">
            Type: {pr.referenceType || 'MANUAL'}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Ref ID: <span className="text-slate-800">{pr.referenceId || 'None'}</span>
          </div>
        </div>

        {/* Total Quantity */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Package size={14} className="text-blue-600" /> Total Items & Quantity
          </div>
          <div className="font-bold text-lg text-slate-900">
            {totalRequestedQty.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500">
            Across <span className="font-semibold text-slate-800">{pr.items?.length || 0}</span> line item(s)
          </div>
        </div>

      </div>

      {/* GENERAL DETAILS & REMARKS CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <Building2 size={16} className="text-blue-600" /> Requisition Context & Remarks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-500 block mb-1">Purpose / Justification:</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 min-h-[42px]">
              {pr.purpose || 'No justification provided.'}
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block mb-1">Header Remarks:</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 min-h-[42px]">
              {pr.remarks || 'No header remarks.'}
            </div>
          </div>
        </div>
      </div>

      {/* LINE ITEMS SUMMARY TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <Package size={16} className="text-blue-600" /> Requested Line Items ({pr.items?.length || 0})
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                <th className="px-3 py-2.5 w-10 text-center">#</th>
                <th className="px-3 py-2.5 w-32">Item Code</th>
                <th className="px-3 py-2.5 min-w-[200px]">Item Description</th>
                <th className="px-3 py-2.5 w-28 text-right">Requested Qty</th>
                <th className="px-3 py-2.5 w-24">UOM</th>
                <th className="px-3 py-2.5 w-32">Required Date</th>
                <th className="px-3 py-2.5 min-w-[160px]">Specification</th>
                <th className="px-3 py-2.5 min-w-[140px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(pr.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-800">{item.itemCode || item.item?.itemCode || '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-900">{item.itemName || item.item?.itemName || '—'}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                    {(Number(item.requestedQuantity) || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-700">
                    {item.uomCode || item.uom?.uomCode || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {item.requiredDate ? new Date(item.requiredDate).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {item.specification || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {item.remarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <td colSpan={3} className="px-3 py-2.5 text-right">Total Requested Quantity:</td>
                <td className="px-3 py-2.5 text-right text-sm text-blue-700">
                  {totalRequestedQty.toLocaleString('en-IN')}
                </td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* AUDIT HISTORY TIMELINE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <History size={16} className="text-blue-600" /> Audit Trail & History
        </h3>

        {(!pr.statusHistory || pr.statusHistory.length === 0) ? (
          <div className="text-xs text-slate-400 py-2">No history recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {pr.statusHistory.map((hist, hIdx) => (
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
                    <StatusBadge status={hist.status} />
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
              Are you sure you want to execute <strong>{activeAction}</strong> on Purchase Requisition <code>{pr.prNumber}</code>?
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Action Remarks / Reason {['REJECT', 'CANCEL', 'CLOSE'].includes(activeAction) && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                placeholder="Enter remarks or justification for this status change..."
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                rows={3}
                required={['REJECT', 'CANCEL', 'CLOSE'].includes(activeAction)}
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
                variant={['REJECT', 'CANCEL'].includes(activeAction) ? 'danger' : 'primary'}
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

    </div>
  );
};

export default PurchaseRequisitionDetail;
