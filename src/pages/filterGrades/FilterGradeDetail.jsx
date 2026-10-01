import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Layers, Edit } from 'lucide-react';

const FilterGradeDetail = ({ grade, isOpen, onClose, onEdit, canEdit }) => {
  if (!isOpen || !grade) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Grade Details"
      size="xl"
      icon={Layers}
      footer={
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="secondary"
              icon={Edit}
              onClick={() => {
                onClose();
                onEdit(grade);
              }}
            >
              Edit
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Master Details Header */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{grade.filterGrade}</h3>
              <p className="text-sm text-slate-500 mt-1">Master Specifications Reference</p>
            </div>
            <StatusBadge status={grade.status} />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">EUROVENT</span>
              <span className="block mt-1 font-medium text-slate-900">{grade.eurovent || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">ISO</span>
              <span className="block mt-1 font-medium text-slate-900">{grade.iso || 'N/A'}</span>
            </div>
            {grade.remarks && (
              <div className="col-span-2">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</span>
                <span className="block mt-1 text-sm text-slate-700">{grade.remarks}</span>
              </div>
            )}
          </div>
        </div>

        {/* Variants Table */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Technical Variants</h4>
          
          {grade.variants && grade.variants.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-md shadow-sm">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-medium">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-200">Filter Class</th>
                    <th className="px-4 py-3 border-b border-slate-200">Filter Type</th>
                    <th className="px-4 py-3 border-b border-slate-200">Temperature</th>
                    <th className="px-4 py-3 border-b border-slate-200">Media</th>
                    <th className="px-4 py-3 border-b border-slate-200">Efficiency @ Micron</th>
                    <th className="px-4 py-3 border-b border-slate-200">Initial P.D.</th>
                    <th className="px-4 py-3 border-b border-slate-200">Final P.D.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {grade.variants.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{v.filterClass || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{v.filterType || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{v.temperature || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{v.media || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{v.efficiency || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{v.initialPressureDrop || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{v.finalPressureDrop || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-md border border-slate-200 text-slate-500">
              No technical variants found for this grade.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FilterGradeDetail;
