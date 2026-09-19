import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Edit } from 'lucide-react';

const UOMDetailModal = ({ uom, isOpen, onClose, onEdit, canEdit }) => {
  if (!isOpen || !uom) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDimensionBadgeClass = (dim) => {
    switch (dim) {
      case 'WEIGHT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'VOLUME':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'LENGTH':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default: // COUNT
        return 'bg-primary-50 text-primary-800 border-primary-200';
    }
  };

  const dimClass = getDimensionBadgeClass(uom.dimension);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`UOM Details — ${uom.uomCode}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              icon={Edit}
              onClick={() => {
                onClose();
                onEdit(uom);
              }}
            >
              Edit UOM
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-md border border-slate-200">
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">
              UOM Code
            </div>
            <div className="font-mono text-sm font-bold text-primary-700 mt-0.5">
              {uom.uomCode}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">
              UOM Name
            </div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">
              {uom.uomName}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">
              Dimension
            </div>
            <span className={`inline-block border px-2 py-0.5 rounded text-xs font-semibold ${dimClass}`}>
              {uom.dimension}
            </span>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">
              Status
            </div>
            <StatusBadge status={uom.status} />
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 font-semibold mb-1">
            Description
          </div>
          <div className={`text-xs bg-white p-2.5 rounded border border-slate-200 min-h-[44px] ${uom.description ? 'text-slate-800' : 'text-slate-400'}`}>
            {uom.description || 'No additional description provided.'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            <strong>Created:</strong> {formatDate(uom.createdAt)}
          </div>
          <div>
            <strong>Last Updated:</strong> {formatDate(uom.updatedAt)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UOMDetailModal;
