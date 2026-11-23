import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import {
  useGetWorkOrderByIdQuery,
  useCreateMaterialIssueMutation,
} from '../../features/workOrders/workOrdersApi';
import { useGetStoresQuery } from '../../features/stores/storesApi';
import { Package, ArrowUpRight, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

const MaterialIssueModal = ({ isOpen, workOrderId, onClose, onSuccess }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');

  // Item selections map: workOrderItemId -> { binId, issuedQty, lineRemarks }
  const [issueInputs, setIssueInputs] = useState({});

  const { data: woData, isLoading: loadingWO, refetch: refetchWO } = useGetWorkOrderByIdQuery(
    workOrderId,
    { skip: !isOpen || !workOrderId }
  );

  const { data: storeData } = useGetStoresQuery(undefined, { skip: !isOpen });
  const [createMaterialIssue, { isLoading: submitting }] = useCreateMaterialIssueMutation();

  const workOrder = woData?.workOrder;
  const woItems = workOrder?.items || [];
  const stores = storeData?.stores || [];

  // Find all bins in the selected store
  const selectedStore = stores.find((s) => s._id === selectedStoreId);
  const storeLocations = selectedStore?.storageLocations || [];
  const storeBins = [];
  storeLocations.forEach((loc) => {
    (loc.bins || []).forEach((b) => {
      storeBins.push({
        _id: b._id,
        binCode: b.binCode,
        binName: b.binName,
        locationCode: loc.locationCode,
      });
    });
  });

  useEffect(() => {
    if (workOrder && isOpen) {
      setError('');
      setSuccess('');
      setRemarks('');
      setSelectedStoreId(workOrder.store?._id || workOrder.store || stores[0]?._id || '');

      // Initialize inputs with pending quantities
      const initialMap = {};
      (workOrder.items || []).forEach((it) => {
        const remaining = Math.max(0, (Number(it.requiredQuantity) || 0) - (Number(it.issuedQuantity) || 0));
        initialMap[it._id] = {
          binId: '',
          issuedQuantity: remaining,
          lineRemarks: '',
          selected: remaining > 0,
        };
      });
      setIssueInputs(initialMap);
    }
  }, [workOrder, isOpen, stores]);

  const handleInputChange = (itemId, field, value) => {
    setIssueInputs((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedStoreId) {
      setError('Please select an issuing Store');
      return;
    }

    const itemsToSubmit = [];
    for (const it of woItems) {
      const input = issueInputs[it._id];
      if (input && input.selected) {
        const qty = Number(input.issuedQuantity);
        if (!qty || qty <= 0) {
          setError(`Please specify a valid quantity for ${it.componentItem?.itemName || 'item'}`);
          return;
        }
        if (!input.binId) {
          setError(`Please select a storage Bin for ${it.componentItem?.itemName || 'item'}`);
          return;
        }
        itemsToSubmit.push({
          workOrderItemId: it._id,
          componentItemId: it.componentItem?._id || it.componentItem,
          binId: input.binId,
          issuedQuantity: qty,
          uomId: it.uom?._id || it.uom,
          lineRemarks: input.lineRemarks || '',
        });
      }
    }

    if (itemsToSubmit.length === 0) {
      setError('Please select at least one material component to issue');
      return;
    }

    try {
      await createMaterialIssue({
        workOrderId: workOrder._id,
        storeId: selectedStoreId,
        remarks: remarks.trim() || `Material issued for Work Order ${workOrder.workOrderNo}`,
        items: itemsToSubmit,
      }).unwrap();

      setSuccess('Material issued successfully and inventory stock updated.');
      refetchWO();
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to post material issue');
    }
  };

  if (!workOrder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Issue Materials from Store — ${workOrder.workOrderNo}`}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={submitting}
            icon={ArrowUpRight}
          >
            Post Material Issue
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Store Selection Header */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="w-72">
            <FormField label="Issuing Store" required>
              <Select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
              >
                <option value="">Select Store</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.storeCode} - {s.storeName}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Work Order: <span className="font-mono font-bold text-slate-900">{workOrder.workOrderNo}</span></div>
            <div>Order Qty: <span className="font-bold text-slate-900">{workOrder.productionQuantity} Units</span></div>
          </div>
        </div>

        {/* Components Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 text-left w-10">Issue?</th>
                <th className="py-2.5 px-3 text-left">Component Item</th>
                <th className="py-2.5 px-3 text-right">Required</th>
                <th className="py-2.5 px-3 text-right">Already Issued</th>
                <th className="py-2.5 px-3 text-left w-48">Source Bin</th>
                <th className="py-2.5 px-3 text-right w-32">Issue Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {woItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-500">
                    No components configured on this work order.
                  </td>
                </tr>
              ) : (
                woItems.map((it) => {
                  const input = issueInputs[it._id] || {};
                  const req = Number(it.requiredQuantity) || 0;
                  const issued = Number(it.issuedQuantity) || 0;
                  const remaining = Math.max(0, req - issued);
                  const isFullyIssued = remaining <= 0;

                  return (
                    <tr key={it._id} className={input.selected ? 'bg-blue-50/30' : 'opacity-60'}>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={!!input.selected}
                          disabled={isFullyIssued}
                          onChange={(e) => handleInputChange(it._id, 'selected', e.target.checked)}
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">
                          {it.componentItem?.itemName || 'Material Item'}
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          {it.componentItem?.itemCode}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                        {req} {it.uom?.uomCode || ''}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                        {issued} {it.uom?.uomCode || ''}
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          className="w-full text-xs rounded border border-slate-300 bg-white px-2 py-1 focus:ring-1 focus:ring-blue-500"
                          value={input.binId || ''}
                          disabled={!input.selected || isFullyIssued}
                          onChange={(e) => handleInputChange(it._id, 'binId', e.target.value)}
                        >
                          <option value="">Select Bin</option>
                          {storeBins.map((b) => (
                            <option key={b._id} value={b._id}>
                              {b.binCode} ({b.locationCode})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          max={remaining}
                          className="w-24 text-right text-xs rounded border border-slate-300 px-2 py-1 font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                          value={input.issuedQuantity !== undefined ? input.issuedQuantity : remaining}
                          disabled={!input.selected || isFullyIssued}
                          onChange={(e) => handleInputChange(it._id, 'issuedQuantity', e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <FormField label="Material Issue Remarks">
          <Textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Storekeeper notes, batch information, etc."
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default MaterialIssueModal;
