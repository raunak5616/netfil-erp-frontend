import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Trash2, AlertTriangle, MapPin, Warehouse, ShieldAlert } from 'lucide-react';

const DeleteStoreModal = ({
  isOpen,
  onClose,
  onConfirm,
  store,
  loading = false,
}) => {
  if (!isOpen || !store) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Store Location"
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
              {loading ? 'Deleting...' : 'Delete Store'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Entity Preview Card */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3.5 transition-all">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Warehouse size={16} className="text-slate-600" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {store.storeName}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[11px] font-semibold text-primary-700 bg-primary-50/70 px-1.5 py-0.5 rounded border border-primary-150">
                    {store.storeCode}
                  </span>
                </div>
              </div>
            </div>
            {store.status && <StatusBadge status={store.status} />}
          </div>

          {store.address && store.address !== 'N/A' && (
            <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-2.5 pt-2.5 border-t border-slate-200/60">
              <MapPin size={13} className="shrink-0 text-slate-400 mt-0.5" />
              <span className="truncate">{store.address}</span>
            </div>
          )}
        </div>

        {/* Impact Warning Notice */}
        <div className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-amber-50/30 to-white p-3.5 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200/80">
            <ShieldAlert size={17} />
          </div>
          <div className="flex-1 text-xs space-y-1.5">
            <p className="font-semibold text-amber-950">
              Permanent Deletion Notice
            </p>
            <p className="text-slate-600 leading-relaxed">
              You are removing this store from active inventory. Unused storage locations and bins linked to this record will also be cleared.
            </p>
            <p className="text-[11px] text-amber-800/80 font-medium">
              Note: Stores with active stock or transaction history cannot be deleted.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteStoreModal;
