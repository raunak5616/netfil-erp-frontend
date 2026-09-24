import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPurchaseEnquiryById,
  updatePurchaseEnquiryStatus
} from '../../services/purchaseEnquiryService';
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
  Clock,
  CheckCircle2,
  FileCheck,
  Ban,
  Archive,
  Package,
  Building2,
  Calendar,
  History,
  FileText,
  Truck,
  DollarSign,
  UserCheck
} from 'lucide-react';

const STATUS_DISPLAY_MAP = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  RESPONSE_PENDING: 'Response Pending',
  RECEIVED: 'Response Received',
  EVALUATED: 'Evaluated',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled'
};

const PurchaseEnquiryDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('PURCHASE_ENQUIRY_EDIT');
  const canSend = hasPermission('PURCHASE_ENQUIRY_SEND');
  const canCancel = hasPermission('PURCHASE_ENQUIRY_CANCEL');

  const [pe, setPe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Workflow Confirmation Modal State
  const [activeAction, setActiveAction] = useState(null); // 'SEND', 'PENDING', 'RECEIVE', 'EVALUATE', 'CLOSE', 'CANCEL'
  const [actionRemarks, setActionRemarks] = useState('');

  const fetchPEDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPurchaseEnquiryById(id);
      if (res.success && res.purchaseEnquiry) {
        setPe(res.purchaseEnquiry);
      } else {
        setError('Purchase Enquiry record not found.');
      }
    } catch (err) {
      console.error('Fetch PE Detail Error:', err);
      setError(err.response?.data?.message || 'Failed to fetch Purchase Enquiry details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPEDetail();
  }, [id]);

  const handleExecuteAction = async () => {
    if (!activeAction || !pe) return;

    if (['CANCEL', 'CLOSE', 'EVALUATE'].includes(activeAction) && !actionRemarks.trim()) {
      setError(`Remarks/Reason is required when performing '${activeAction}' action.`);
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      const res = await updatePurchaseEnquiryStatus(pe._id, activeAction, actionRemarks.trim());
      if (res.success && res.purchaseEnquiry) {
        setSuccess(`Purchase Enquiry status transitioned to '${STATUS_DISPLAY_MAP[res.purchaseEnquiry.status] || res.purchaseEnquiry.status}'`);
        setPe(res.purchaseEnquiry);
        setActiveAction(null);
        setActionRemarks('');
      } else {
        setError(res.message || 'Workflow transition failed.');
      }
    } catch (err) {
      console.error('PE Workflow transition error:', err);
      setError(err.response?.data?.message || 'Error executing workflow transition.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-xs font-semibold">Loading Purchase Enquiry details...</span>
      </div>
    );
  }

  if (error && !pe) {
    return (
      <div className="space-y-4">
        <Alert type="danger" message={error} />
        <Button variant="secondary" size="sm" onClick={() => navigate('/purchase-enquiries')}>
          <ArrowLeft size={14} className="mr-1.5" /> Back to Enquiries
        </Button>
      </div>
    );
  }

  if (!pe) return null;

  const totalRequestedQty = pe.totalRequestedQuantity !== undefined && pe.totalRequestedQuantity !== null
    ? pe.totalRequestedQuantity
    : (pe.items || []).reduce((sum, item) => sum + (Number(item.requestedQuantity) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <PageHeader
        title={`Purchase Enquiry: ${pe.enquiryNumber}`}
        subtitle={`Created on ${new Date(pe.enquiryDate).toLocaleDateString('en-GB')} by ${pe.createdBy?.fullName || pe.createdBy?.username || 'System'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/purchase-enquiries')}
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Back to Enquiries
            </Button>

            {canEdit && pe.status === 'DRAFT' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/purchase-enquiries/${pe._id}/edit`)}
              >
                <Edit size={14} className="mr-1.5" />
                Edit Draft PE
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
          <StatusBadge status={pe.status} label={STATUS_DISPLAY_MAP[pe.status] || pe.status} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* DRAFT -> SEND */}
          {pe.status === 'DRAFT' && canSend && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveAction('SEND');
                setActionRemarks('Enquiry sent to supplier');
              }}
            >
              <Send size={14} className="mr-1.5" /> Send to Supplier
            </Button>
          )}

          {/* SENT STATUS ACTIONS */}
          {pe.status === 'SENT' && (
            <>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveAction('PENDING');
                    setActionRemarks('Followed up, waiting for supplier response');
                  }}
                >
                  <Clock size={14} className="mr-1.5 text-amber-600" /> Mark Response Pending
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveAction('RECEIVE');
                    setActionRemarks('Supplier quotation response received');
                  }}
                >
                  <CheckCircle2 size={14} className="mr-1.5" /> Mark Response Received
                </Button>
              )}
            </>
          )}

          {/* RESPONSE_PENDING STATUS ACTIONS */}
          {pe.status === 'RESPONSE_PENDING' && (
            <>
              {canEdit && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveAction('RECEIVE');
                    setActionRemarks('Supplier quotation response received');
                  }}
                >
                  <CheckCircle2 size={14} className="mr-1.5" /> Mark Response Received
                </Button>
              )}
            </>
          )}

          {/* RECEIVED STATUS ACTIONS */}
          {pe.status === 'RECEIVED' && (
            <>
              {canEdit && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveAction('EVALUATE');
                    setActionRemarks('Quotation evaluated');
                  }}
                >
                  <FileCheck size={14} className="mr-1.5" /> Evaluate Quotation
                </Button>
              )}
            </>
          )}

          {/* EVALUATED STATUS ACTIONS */}
          {pe.status === 'EVALUATED' && (
            <>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveAction('CLOSE');
                    setActionRemarks('Purchase enquiry evaluation complete & closed');
                  }}
                >
                  <Archive size={14} className="mr-1.5 text-slate-700" /> Close Enquiry
                </Button>
              )}
            </>
          )}

          {/* CANCEL ACTION FOR ELIGIBLE NON-TERMINAL STATES */}
          {canCancel && !['CANCELLED', 'CLOSED'].includes(pe.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveAction('CANCEL');
                setActionRemarks('');
              }}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              <Ban size={14} className="mr-1.5" /> Cancel Enquiry
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
            {pe.supplierName || pe.supplier?.companyName || '—'}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Code: <span className="text-slate-800">{pe.supplier?.partyCode || 'N/A'}</span>
          </div>
        </div>

        {/* Department & PR Ref */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} className="text-blue-600" /> Dept & PR Reference
          </div>
          <div className="font-semibold text-sm text-slate-900">
            PR: {pe.prNumber || pe.purchaseRequisition?.prNumber || 'Direct PE'}
          </div>
          <div className="text-xs text-slate-500">
            Dept: <span className="font-medium text-slate-800">{pe.department?.departmentName || '—'}</span>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} className="text-blue-600" /> Timeline & Validity
          </div>
          <div className="font-semibold text-sm text-slate-900">
            Expected: {pe.expectedResponseDate ? new Date(pe.expectedResponseDate).toLocaleDateString('en-GB') : '—'}
          </div>
          <div className="text-xs text-slate-500">
            Validity: <span className="font-medium text-slate-800">{pe.validityDate ? new Date(pe.validityDate).toLocaleDateString('en-GB') : 'No Limit'}</span>
          </div>
        </div>

        {/* Total Quantity */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Package size={14} className="text-blue-600" /> Total Line Items & Qty
          </div>
          <div className="font-bold text-lg text-slate-900">
            {totalRequestedQty.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500">
            Across <span className="font-semibold text-slate-800">{pe.items?.length || 0}</span> item(s)
          </div>
        </div>

      </div>

      {/* TERMS & REMARKS CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <FileText size={16} className="text-blue-600" /> Terms, Conditions & Remarks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-500 block mb-1">Delivery Requirements:</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 min-h-[38px]">
              {pe.deliveryRequirements || 'Standard delivery'}
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block mb-1">Payment Terms:</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 min-h-[38px]">
              {pe.paymentTerms || 'Standard terms'}
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block mb-1">Delivery Terms (Incoterms):</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 min-h-[38px]">
              {pe.deliveryTerms || 'Standard terms'}
            </div>
          </div>
          <div className="md:col-span-3">
            <span className="font-semibold text-slate-500 block mb-1">General Remarks:</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 min-h-[38px]">
              {pe.remarks || 'No general remarks.'}
            </div>
          </div>
        </div>
      </div>

      {/* LINE ITEMS SUMMARY TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <Package size={16} className="text-blue-600" /> Enquired Line Items ({pe.items?.length || 0})
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
              {(pe.items || []).map((item, idx) => (
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

        {(!pe.statusHistory || pe.statusHistory.length === 0) ? (
          <div className="text-xs text-slate-400 py-2">No history recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {pe.statusHistory.map((hist, hIdx) => (
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
              Are you sure you want to execute <strong>{activeAction}</strong> on Purchase Enquiry <code>{pe.enquiryNumber}</code>?
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Action Remarks / Reason {['CANCEL', 'CLOSE', 'EVALUATE'].includes(activeAction) && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                placeholder="Enter remarks or justification for this status transition..."
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                rows={3}
                required={['CANCEL', 'CLOSE', 'EVALUATE'].includes(activeAction)}
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

    </div>
  );
};

export default PurchaseEnquiryDetail;
