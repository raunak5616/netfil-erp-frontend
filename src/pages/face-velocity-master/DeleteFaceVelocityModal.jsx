import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Trash2, Gauge, AlertTriangle, Layers } from 'lucide-react';

const DeleteFaceVelocityModal = ({
  isOpen,
  onClose,
  onConfirm,
  config,
  loading = false,
}) => {
  if (!isOpen || !config) return null;

  const assignedGrades = Array.isArray(config.filterGrades) && config.filterGrades.length > 0
    ? config.filterGrades
    : (config.filterGrade ? [config.filterGrade] : []);

  const gradeNames = assignedGrades.map((g) => g.filterGrade || 'Grade').join(', ') || 'Filter Grade';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Face Velocity Configuration"
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
              className="text-xs px-3.5 py-1.5 shadow-sm font-semibold !bg-red-600 hover:!bg-red-700 text-white"
            >
              {loading ? 'Deleting...' : 'Delete Configuration'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Configuration Preview Card */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3.5 transition-all">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-primary-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Gauge size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate" title={gradeNames}>
                  {gradeNames} – Depth {config.minDepth}–{config.maxDepth} mm
                </h4>
                <p className="text-xs text-slate-500">
                  Depth Range: {config.minDepth} – {config.maxDepth} mm ({assignedGrades.length} Grade{assignedGrades.length > 1 ? 's' : ''})
                </p>
              </div>
            </div>
            <StatusBadge status={config.status} />
          </div>

          <div className="pt-2 border-t border-slate-200/60 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Face Velocity</span>
              <span className="font-semibold text-primary-600">{config.faceVelocity} FPM</span>
            </div>
          </div>
        </div>

        {/* Warning text */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Dependency Protection</p>
            <p className="text-amber-700 mt-0.5">
              If this configuration is actively referenced by items in the Item Master, the system will prevent deletion to preserve engineering integrity.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteFaceVelocityModal;
