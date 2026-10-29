import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Trash2, Layers, ShieldAlert, Award } from 'lucide-react';

const DeleteFilterGradeModal = ({
  isOpen,
  onClose,
  onConfirm,
  grade,
  loading = false,
}) => {
  if (!isOpen || !grade) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Filter Grade"
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
              {loading ? 'Deleting...' : 'Delete Filter Grade'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Filter Grade Preview Card */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3.5 transition-all">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Layers size={16} className="text-slate-600" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {grade.filterGrade}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {grade.variants?.length || 0} Variant{(grade.variants?.length || 0) === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>
            {grade.status && <StatusBadge status={grade.status} />}
          </div>

          {/* Standard Classification Badges */}
          {(grade.eurovent || grade.iso) && (
            <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-200/60 text-xs">
              {grade.eurovent && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">EUROVENT:</span>
                  <span className="font-semibold text-slate-800">{grade.eurovent}</span>
                </div>
              )}
              {grade.iso && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">ISO:</span>
                  <span className="font-semibold text-slate-800">{grade.iso}</span>
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
              You are removing this technical grade and its variant specifications from the master catalog.
            </p>
            <p className="text-[11px] text-amber-800/80 font-medium">
              Note: Filter grades referenced in items or technical drawings cannot be deleted.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteFilterGradeModal;
