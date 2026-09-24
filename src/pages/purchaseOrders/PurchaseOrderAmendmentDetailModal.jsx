import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { FileText, Calendar, User, History, Package } from 'lucide-react';

const PurchaseOrderAmendmentDetailModal = ({ isOpen, onClose, amendment }) => {
  if (!isOpen || !amendment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Amendment Details: ${amendment.amendmentNo}`}
      size="lg"
    >
      <div className="space-y-4 text-xs">
        
        {/* Header Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 border border-slate-200 rounded-lg">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Amendment No:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{amendment.amendmentNo}</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Original PO No:</span>
            <span className="font-mono font-semibold text-slate-800">{amendment.originalPoNumber}</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Amendment Date:</span>
            <span className="font-medium text-slate-800">
              {amendment.amendmentDate ? new Date(amendment.amendmentDate).toLocaleDateString('en-GB') : '—'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Created By:</span>
            <span className="font-medium text-slate-800">
              {amendment.createdBy?.fullName || amendment.createdBy?.username || '—'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status:</span>
            <StatusBadge status={amendment.status || 'APPROVED'} />
          </div>
        </div>

        {/* Reason & Remarks */}
        <div className="space-y-2 bg-purple-50/50 p-3 border border-purple-100 rounded-lg">
          <div>
            <strong className="text-purple-900 font-bold block">Amendment Reason:</strong>
            <p className="text-slate-800 mt-0.5">{amendment.reason}</p>
          </div>
          {amendment.remarks && (
            <div>
              <strong className="text-purple-900 font-bold block">Remarks:</strong>
              <p className="text-slate-700 italic mt-0.5">{amendment.remarks}</p>
            </div>
          )}
        </div>

        {/* Changed Fields */}
        <div>
          <strong className="text-slate-700 font-bold uppercase text-[11px] tracking-wider block mb-1">
            Changed Fields:
          </strong>
          {Array.isArray(amendment.changedFields) && amendment.changedFields.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {amendment.changedFields.map((field, idx) => (
                <span key={idx} className="font-mono text-[11px] px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded">
                  {field}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-400">None specified</span>
          )}
        </div>

        {/* Header Snapshot (Previous State) */}
        {amendment.headerSnapshot && Object.keys(amendment.headerSnapshot).length > 0 && (
          <div className="space-y-1 border-t border-slate-200 pt-3">
            <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide flex items-center gap-1">
              <History size={14} className="text-blue-600" /> Header Snapshot (Prior State)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-400 block">Expected Delivery:</span>
                <span className="font-semibold text-slate-800">
                  {amendment.headerSnapshot.expectedDeliveryDate
                    ? new Date(amendment.headerSnapshot.expectedDeliveryDate).toLocaleDateString('en-GB')
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Delivery Location:</span>
                <span className="font-semibold text-slate-800">{amendment.headerSnapshot.deliveryLocation || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Payment Terms:</span>
                <span className="font-semibold text-slate-800">{amendment.headerSnapshot.paymentTerms || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Freight:</span>
                <span className="font-semibold text-slate-800">₹ {(Number(amendment.headerSnapshot.freight) || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Other Charges:</span>
                <span className="font-semibold text-slate-800">₹ {(Number(amendment.headerSnapshot.otherCharges) || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Grand Total:</span>
                <span className="font-semibold text-slate-800">₹ {(Number(amendment.headerSnapshot.grandTotal) || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseOrderAmendmentDetailModal;
