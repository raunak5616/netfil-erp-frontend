import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Gauge, Layers, Ruler, Activity, Calendar, User, Info } from 'lucide-react';

const FaceVelocityDetailModal = ({
  isOpen,
  onClose,
  config,
  onEdit,
}) => {
  if (!isOpen || !config) return null;

  const assignedGrades = Array.isArray(config.filterGrades) && config.filterGrades.length > 0
    ? config.filterGrades
    : (config.filterGrade ? [config.filterGrade] : []);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Face Velocity Configuration Details"
      maxWidth="600px"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">
            ID: <span className="font-mono text-[11px]">{config._id}</span>
          </span>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  onEdit(config);
                }}
                className="text-xs px-3.5 py-1.5"
              >
                Edit Configuration
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={onClose}
              className="text-xs px-3.5 py-1.5"
            >
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Header Summary Card */}
        <div className="bg-gradient-to-r from-primary-50/50 to-blue-50/50 rounded-xl border border-primary-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Gauge size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-base font-bold text-slate-900">
                    {assignedGrades.length > 1
                      ? `${assignedGrades.length} Assigned Filter Grades`
                      : (assignedGrades[0]?.filterGrade || 'Filter Grade')}
                  </h3>
                  <StatusBadge status={config.status} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {assignedGrades.map((g, idx) => (
                    <span
                      key={g._id || idx}
                      className="inline-flex items-center gap-1 text-xs font-semibold bg-white text-primary-800 px-2.5 py-0.5 rounded-md border border-primary-200 shadow-2xs"
                    >
                      <Layers size={12} className="text-primary-600" />
                      <span>{g.filterGrade || 'Grade'}</span>
                      {g.eurovent && <span className="text-[10px] text-slate-500 font-normal">({g.eurovent})</span>}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Face Velocity Master Engineering Specification
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dimension & Depth Range Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Ruler size={14} className="text-primary-600" />
            <span>Filter Dimensions & Depth Range</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Height (H)</span>
              <span className="text-sm font-bold text-slate-900">{config.height} mm</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Width (W)</span>
              <span className="text-sm font-bold text-slate-900">{config.width} mm</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Min Depth</span>
              <span className="text-sm font-bold text-slate-900">{config.minDepth} mm</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Max Depth</span>
              <span className="text-sm font-bold text-slate-900">{config.maxDepth} mm</span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-blue-50/50 rounded-lg px-3 py-2 border border-blue-100/60 text-xs">
            <span className="text-slate-600 font-medium">Depth Range Coverage:</span>
            <span className="font-semibold text-blue-700">{config.minDepth} mm to {config.maxDepth} mm</span>
          </div>
        </div>

        {/* Engineering Performance Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Activity size={14} className="text-primary-600" />
            <span>Engineering Performance Parameters</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Pleats / Foot</span>
              <span className="text-base font-bold text-slate-900">{config.pleatsPerFeet}</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Filtration Area</span>
              <span className="text-base font-bold text-slate-900">{config.filtrationArea} <span className="text-xs font-normal text-slate-500">Sq. M.</span></span>
            </div>
            <div className="bg-primary-50/50 rounded-lg p-2.5 border border-primary-100">
              <span className="text-[10px] text-primary-600 block uppercase font-bold tracking-wider">Face Velocity</span>
              <span className="text-base font-bold text-primary-700">{config.faceVelocity} <span className="text-xs font-normal text-primary-600">FPM</span></span>
            </div>
          </div>
        </div>

        {/* Remarks Section */}
        {config.remarks && (
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 text-xs">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Remarks / Engineering Notes</span>
            <p className="text-slate-700 whitespace-pre-wrap">{config.remarks}</p>
          </div>
        )}

        {/* Audit Meta */}
        <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} />
            <span>Created: {formatDate(config.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <User size={13} />
            <span>Updated: {formatDate(config.updatedAt)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FaceVelocityDetailModal;
