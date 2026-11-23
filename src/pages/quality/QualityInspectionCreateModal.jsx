import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Select, Textarea } from '../../components/ui/FormField';
import { useCreateQualityInspectionMutation } from '../../features/quality/qualityApi';
import { useGetGoodsReceiptsQuery } from '../../features/purchase/purchaseApi';
import { ShieldCheck, Package } from 'lucide-react';

const QualityInspectionCreateModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedGrnId, setSelectedGrnId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const [createInspection, { isLoading: submitting }] = useCreateQualityInspectionMutation();
  const { data: grnData, isLoading: loadingGrns } = useGetGoodsReceiptsQuery(
    { status: 'POSTED', limit: 50 },
    { skip: !isOpen }
  );

  const goodsReceipts = grnData?.goodsReceipts || [];
  const selectedGrn = goodsReceipts.find((g) => g._id === selectedGrnId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedGrnId) {
      setError('Please select a posted Goods Receipt Note');
      return;
    }

    try {
      await createInspection({
        goodsReceipt: selectedGrnId,
        remarks: remarks.trim() || `Inspection initiated for GRN ${selectedGrn?.grnNumber}`,
      }).unwrap();

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to create quality inspection');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate Quality Inspection"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={submitting}
            icon={ShieldCheck}
          >
            Create Inspection
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <FormField label="Source Goods Receipt Note (GRN)" required>
          <Select
            value={selectedGrnId}
            onChange={(e) => setSelectedGrnId(e.target.value)}
            disabled={loadingGrns}
          >
            <option value="">Select Posted GRN</option>
            {goodsReceipts.map((grn) => (
              <option key={grn._id} value={grn._id}>
                {grn.grnNumber} — {grn.supplier?.companyName || grn.supplierNameSnapshot} (
                {new Date(grn.grnDate).toLocaleDateString('en-GB')})
              </option>
            ))}
          </Select>
        </FormField>

        {selectedGrn && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Supplier:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {selectedGrn.supplier?.companyName || selectedGrn.supplierNameSnapshot}
                </span>
              </div>
              <div>
                <span className="text-slate-500">PO Reference:</span>{' '}
                <span className="font-mono font-semibold text-slate-800">
                  {selectedGrn.poNumberSnapshot || selectedGrn.purchaseOrder?.poNumber}
                </span>
              </div>
            </div>

            <div className="font-semibold text-slate-700 pt-1 border-t border-slate-200">
              Line Items to Inspect ({selectedGrn.items?.length || 0}):
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              {(selectedGrn.items || []).map((it, idx) => (
                <li key={idx}>
                  <span className="font-medium text-slate-900">{it.itemNameSnapshot}</span> —{' '}
                  <span className="font-bold text-slate-800">{it.receivedQuantity}</span>{' '}
                  {it.uomCodeSnapshot || 'Units'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <FormField label="Inspection Notes">
          <Textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Special inspection requirements, sampling instructions, etc."
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default QualityInspectionCreateModal;
