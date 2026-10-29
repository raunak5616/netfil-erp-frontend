import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Trash2, Truck, CreditCard, ShieldAlert } from 'lucide-react';

const DeleteTermModal = ({
  isOpen,
  onClose,
  onConfirm,
  term,
  loading = false,
}) => {
  if (!isOpen || !term) return null;

  const isDelivery = term.termType === 'DELIVERY';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${isDelivery ? 'Delivery' : 'Payment'} Term`}
      maxWidth="480px"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-400 font-medium">
            Action cannot be reverted
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="text-xs px-3.5 py-1.5"
            >
              Cancel
            </Button>
            <Button
              variant="dark"
              onClick={onConfirm}
              loading={loading}
              icon={Trash2}
              className="text-xs px-3.5 py-1.5 shadow-sm font-semibold"
            >
              {loading ? 'Deleting...' : `Delete ${isDelivery ? 'Delivery' : 'Payment'} Term`}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Term Preview Card */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3.5 transition-all">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
                {isDelivery ? (
                  <Truck size={16} className="text-blue-600" />
                ) : (
                  <CreditCard size={16} className="text-emerald-600" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {term.termName}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Type: {term.termType}
                  </span>
                </div>
              </div>
            </div>
            <StatusBadge status={term.isActive ? 'active' : 'inactive'} />
          </div>

          {term.description && (
            <div className="text-xs text-slate-600 bg-white border border-slate-100 rounded-lg p-2.5 mt-2">
              <span className="font-medium text-slate-700">Clause: </span>
              {term.description}
            </div>
          )}
        </div>

        {/* Soft Amber Warning Box */}
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-3 flex gap-2.5 items-start">
          <ShieldAlert size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-semibold text-amber-950">Confirm master record removal</p>
            <p className="text-[11.5px] leading-relaxed text-amber-800">
              Are you sure you want to delete <span className="font-semibold">"{term.termName}"</span>?
              Removing this term will eliminate it from future selection dropdowns.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteTermModal;
