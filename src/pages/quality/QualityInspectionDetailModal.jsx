import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import {
  useGetQualityInspectionByIdQuery,
  useUpdateQualityInspectionStatusMutation,
} from '../../features/quality/qualityApi';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  FileCheck,
  AlertTriangle,
  Package,
  Layers,
} from 'lucide-react';

const QualityInspectionDetailModal = ({ isOpen, inspectionId, onClose, onUpdated }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');

  const {
    data: qiData,
    isLoading,
    refetch,
  } = useGetQualityInspectionByIdQuery(inspectionId, {
    skip: !isOpen || !inspectionId,
  });

  const [updateStatus, { isLoading: updating }] = useUpdateQualityInspectionStatusMutation();
  const inspection = qiData?.qualityInspection;

  const handleAction = async (action, rejectionReason = '') => {
    setError('');
    setSuccess('');
    try {
      await updateStatus({
        id: inspectionId,
        action,
        remarks: actionRemarks.trim(),
        rejectionReason,
      }).unwrap();

      setSuccess(`Action '${action}' executed successfully.`);
      refetch();
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err?.data?.message || err?.message || `Failed to perform action ${action}`);
    }
  };

  if (!inspection && isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading Inspection Detail...">
        <div className="py-8 text-center text-slate-500">Loading quality inspection records...</div>
      </Modal>
    );
  }

  if (!inspection) return null;

  const items = inspection.items || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Quality Inspection Record — ${inspection.inspectionNumber}`}
      size="xl"
      footer={
        <div className="flex justify-between items-center w-full">
          {/* Status Action Buttons */}
          <div className="flex gap-2">
            {inspection.status === 'DRAFT' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('SUBMIT')}
                isLoading={updating}
                icon={Play}
              >
                Submit for Inspection
              </Button>
            )}

            {inspection.status === 'SUBMITTED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAction('START_INSPECTION')}
                isLoading={updating}
                icon={Play}
              >
                Start Inspection
              </Button>
            )}

            {['UNDER_INSPECTION', 'INSPECTED'].includes(inspection.status) && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAction('ACCEPT')}
                  isLoading={updating}
                  icon={CheckCircle2}
                >
                  Accept Lots
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('REJECT', 'QUALITY_FAILURE')}
                  isLoading={updating}
                  icon={XCircle}
                  className="text-rose-600 hover:text-rose-700"
                >
                  Reject Lots
                </Button>
              </>
            )}

            {['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'].includes(inspection.status) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('CLOSE')}
                isLoading={updating}
                icon={FileCheck}
              >
                Close Inspection
              </Button>
            )}
          </div>

          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Overview Header Cards */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Inspection #</div>
            <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
              {inspection.inspectionNumber}
            </div>
            <div className="text-xs text-slate-500">
              {new Date(inspection.inspectionDate).toLocaleDateString('en-GB')}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Source GRN</div>
            <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
              {inspection.grnNumberSnapshot}
            </div>
            <div className="text-xs text-slate-500">PO: {inspection.poNumberSnapshot}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Status</div>
            <div className="mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">
                {inspection.status}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Overall QA Result</div>
            <div className="mt-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  inspection.overallResult === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : inspection.overallResult === 'FAIL'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {inspection.overallResult}
              </span>
            </div>
          </div>
        </div>

        {/* Supplier & Store Context */}
        <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-3 flex justify-between">
          <div>
            <span className="font-semibold text-slate-800">Supplier:</span> {inspection.supplierNameSnapshot}
          </div>
          <div>
            <span className="font-semibold text-slate-800">Store:</span> {inspection.store?.storeName || 'Store'} (
            {inspection.plant?.plantName || 'Plant'})
          </div>
          <div>
            <span className="font-semibold text-slate-800">Inspector:</span>{' '}
            {inspection.inspector?.username || 'Quality QA Lead'}
          </div>
        </div>

        {/* Inspection Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 text-left">Item / Material</th>
                <th className="py-2.5 px-3 text-right">Received Qty</th>
                <th className="py-2.5 px-3 text-right">Sample Qty</th>
                <th className="py-2.5 px-3 text-right">Accepted</th>
                <th className="py-2.5 px-3 text-right">Rejected</th>
                <th className="py-2.5 px-3 text-center">Result</th>
                <th className="py-2.5 px-3 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((it, idx) => (
                <tr key={it._id || idx}>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{it.itemNameSnapshot}</div>
                    <div className="text-xs font-mono text-slate-500">{it.itemCodeSnapshot}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                    {it.receivedQuantity} {it.uomCodeSnapshot}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {it.sampleQuantity} {it.uomCodeSnapshot}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                    {it.acceptedQuantity}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                    {it.rejectedQuantity}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        it.inspectionResult === 'PASS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : it.inspectionResult === 'FAIL'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {it.inspectionResult}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-500 italic">
                    {it.rejectionReason ? `Reason: ${it.rejectionReason}. ` : ''}
                    {it.remarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Remarks Input */}
        {['DRAFT', 'SUBMITTED', 'UNDER_INSPECTION', 'INSPECTED'].includes(inspection.status) && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              QA Audit Remarks & Notes (Optional)
            </label>
            <input
              type="text"
              className="w-full text-sm rounded-lg border border-slate-300 p-2 text-slate-900 focus:ring-1 focus:ring-blue-500"
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="e.g. Dimensions verified with vernier caliper, zero visual defects"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QualityInspectionDetailModal;
