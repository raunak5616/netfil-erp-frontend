import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Trash2, Package, ShieldAlert, Layers, Tag } from 'lucide-react';

const DeleteItemModal = ({
  isOpen,
  onClose,
  onConfirm,
  item,
  loading = false,
}) => {
  if (!isOpen || !item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Catalog Item"
      maxWidth="500px"
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
              {loading ? 'Deleting...' : 'Delete Item'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Item Preview Card */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3.5 transition-all">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Package size={16} className="text-slate-600" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {item.itemName}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[11px] font-semibold text-primary-700 bg-primary-50/70 px-1.5 py-0.5 rounded border border-primary-150">
                    {item.itemCode}
                  </span>
                  {item.inventoryUom?.uomCode && (
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      UOM: {item.inventoryUom.uomCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {item.status && <StatusBadge status={item.status} />}
          </div>

          {/* Group and Category Badges */}
          {(item.itemGroup?.groupName || item.itemCategory?.categoryName) && (
            <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600">
              {item.itemGroup?.groupName && (
                <div className="flex items-center gap-1">
                  <Layers size={13} className="text-slate-400" />
                  <span className="font-medium">{item.itemGroup.groupName}</span>
                </div>
              )}
              {item.itemCategory?.categoryName && (
                <div className="flex items-center gap-1">
                  <Tag size={13} className="text-slate-400" />
                  <span className="font-medium text-slate-700">{item.itemCategory.categoryName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Impact Warning Notice (Warm Amber Palette) */}
        <div className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-amber-50/30 to-white p-3.5 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200/80">
            <ShieldAlert size={17} />
          </div>
          <div className="flex-1 text-xs space-y-1.5">
            <p className="font-semibold text-amber-950">
              Permanent Deletion Notice
            </p>
            <p className="text-slate-600 leading-relaxed">
              You are removing this item from the Items Catalog. Any custom assigned specification values will also be deleted.
            </p>
            <p className="text-[11px] text-amber-800/80 font-medium">
              Note: Items linked to sales orders, quotations, purchase orders, BOMs, or inventory stock cannot be deleted.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteItemModal;
