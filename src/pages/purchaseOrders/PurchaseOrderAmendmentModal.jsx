import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { createPurchaseOrderAmendment } from '../../services/purchaseOrderService';
import { Plus, Trash2, Save, FileEdit } from 'lucide-react';

const PurchaseOrderAmendmentModal = ({
  isOpen,
  onClose,
  purchaseOrder,
  itemsList = [],
  uomsList = [],
  onSuccess
}) => {
  if (!isOpen || !purchaseOrder) return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  // Editable header fields for amendment
  const [deliveryLocation, setDeliveryLocation] = useState(purchaseOrder.deliveryLocation || '');
  const [paymentTerms, setPaymentTerms] = useState(purchaseOrder.paymentTerms || '');
  const [deliveryTerms, setDeliveryTerms] = useState(purchaseOrder.deliveryTerms || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    return purchaseOrder.expectedDeliveryDate
      ? new Date(purchaseOrder.expectedDeliveryDate).toISOString().split('T')[0]
      : '';
  });
  const [freight, setFreight] = useState(purchaseOrder.freight || 0);
  const [otherCharges, setOtherCharges] = useState(purchaseOrder.otherCharges || 0);

  // Line items state for amendment
  const [lineItems, setLineItems] = useState(() => {
    if (Array.isArray(purchaseOrder.items) && purchaseOrder.items.length > 0) {
      return purchaseOrder.items.map((i) => ({
        item: i.item?._id || i.item || '',
        itemCode: i.itemCodeSnapshot || i.item?.itemCode || '',
        itemName: i.itemNameSnapshot || i.item?.itemName || '',
        quantity: i.quantity || 1,
        uom: i.uom?._id || i.uom || '',
        uomCode: i.uomCodeSnapshot || i.uom?.uomCode || '',
        unitRate: i.unitRate || 0,
        discount: i.discount || 0,
        taxRate: i.taxRate || 0,
        requiredDate: i.requiredDate ? new Date(i.requiredDate).toISOString().split('T')[0] : '',
        specification: i.specification || '',
        remarks: i.remarks || ''
      }));
    }
    return [];
  });

  const handleLineFieldChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setLineItems(updated);
  };

  const handleItemSelect = (index, itemId) => {
    const updated = [...lineItems];
    const targetItem = itemsList.find((i) => i._id === itemId);

    if (targetItem) {
      let defaultUomId = '';
      if (targetItem.purchaseUom) {
        defaultUomId = typeof targetItem.purchaseUom === 'object' ? targetItem.purchaseUom._id : targetItem.purchaseUom;
      } else if (targetItem.inventoryUom) {
        defaultUomId = typeof targetItem.inventoryUom === 'object' ? targetItem.inventoryUom._id : targetItem.inventoryUom;
      }
      const matchingUom = uomsList.find((u) => u._id === defaultUomId);

      updated[index] = {
        ...updated[index],
        item: targetItem._id,
        itemCode: targetItem.itemCode || '',
        itemName: targetItem.itemName || '',
        specification: updated[index].specification || targetItem.description || '',
        uom: defaultUomId || updated[index].uom,
        uomCode: matchingUom ? matchingUom.uomCode : updated[index].uomCode
      };
    } else {
      updated[index] = {
        ...updated[index],
        item: '',
        itemCode: '',
        itemName: ''
      };
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        item: '',
        itemCode: '',
        itemName: '',
        quantity: 1,
        uom: '',
        uomCode: '',
        unitRate: 0,
        discount: 0,
        taxRate: 0,
        requiredDate: '',
        specification: '',
        remarks: ''
      }
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) {
      setError('An amended Purchase Order must contain at least one line item.');
      return;
    }
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('Amendment reason is required.');
      return;
    }

    if (!lineItems || lineItems.length === 0) {
      setError('At least one line item is required.');
      return;
    }

    // Validate line items
    for (let idx = 0; idx < lineItems.length; idx++) {
      const line = lineItems[idx];
      const lineNo = idx + 1;
      if (!line.item) {
        setError(`Line Item #${lineNo}: Please select a master item.`);
        return;
      }
      if (!line.uom) {
        setError(`Line Item #${lineNo}: Please select a UOM.`);
        return;
      }
      const qty = Number(line.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        setError(`Line Item #${lineNo}: Quantity must be greater than 0.`);
        return;
      }
      const rate = Number(line.unitRate);
      if (Number.isNaN(rate) || rate < 0) {
        setError(`Line Item #${lineNo}: Unit rate cannot be negative.`);
        return;
      }
    }

    const payload = {
      reason: reason.trim(),
      remarks: remarks.trim(),
      headerUpdates: {
        deliveryLocation,
        paymentTerms,
        deliveryTerms,
        expectedDeliveryDate,
        freight: Number(freight) || 0,
        otherCharges: Number(otherCharges) || 0,
        remarks: purchaseOrder.remarks || ''
      },
      itemUpdates: lineItems.map((li) => ({
        item: li.item,
        quantity: Number(li.quantity),
        uom: li.uom,
        unitRate: Number(li.unitRate) || 0,
        discount: Number(li.discount) || 0,
        taxRate: Number(li.taxRate) || 0,
        specification: li.specification || '',
        requiredDate: li.requiredDate || null,
        remarks: li.remarks || ''
      }))
    };

    setLoading(true);
    try {
      const res = await createPurchaseOrderAmendment(purchaseOrder._id, payload);
      if (res.success) {
        if (onSuccess) onSuccess(res.amendment, res.purchaseOrder);
      } else {
        setError(res.message || 'Failed to create amendment.');
      }
    } catch (err) {
      console.error('Create Amendment error:', err);
      setError(err.response?.data?.message || 'Error creating Purchase Order Amendment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create PO Amendment (${purchaseOrder.poNumber})`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        {/* Reason & Remarks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50/60 p-3.5 border border-purple-200 rounded-lg">
          <FormField label="Amendment Reason" required className="md:col-span-2">
            <Input
              type="text"
              placeholder="State the commercial or technical reason for this PO amendment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Amendment Remarks" className="md:col-span-2">
            <Textarea
              placeholder="Additional documentation notes for amendment history..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
            />
          </FormField>
        </div>

        {/* Header Field Updates */}
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
            Amendable Header Fields
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <FormField label="Expected Delivery Date">
              <Input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </FormField>

            <FormField label="Delivery Location">
              <Input
                type="text"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
              />
            </FormField>

            <FormField label="Payment Terms">
              <Input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </FormField>

            <FormField label="Delivery Terms">
              <Input
                type="text"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
              />
            </FormField>

            <FormField label="Freight Charges">
              <Input
                type="number"
                step="any"
                min="0"
                value={freight}
                onChange={(e) => setFreight(e.target.value)}
                className="text-right"
              />
            </FormField>

            <FormField label="Other Charges">
              <Input
                type="number"
                step="any"
                min="0"
                value={otherCharges}
                onChange={(e) => setOtherCharges(e.target.value)}
                className="text-right"
              />
            </FormField>
          </div>
        </div>

        {/* Amended Line Items */}
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
              Amended Line Items ({lineItems.length})
            </h4>
            <Button type="button" variant="outline" size="xs" onClick={addLineItem}>
              <Plus size={13} className="mr-1" /> Add Line
            </Button>
          </div>

          <div className="overflow-x-auto max-h-60 custom-scrollbar border border-slate-200 rounded">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                <tr>
                  <th className="p-2 w-8 text-center">#</th>
                  <th className="p-2 min-w-[150px]">Item</th>
                  <th className="p-2 w-20">Qty</th>
                  <th className="p-2 w-24">UOM</th>
                  <th className="p-2 w-24">Unit Rate</th>
                  <th className="p-2 w-20">Discount</th>
                  <th className="p-2 w-20">Tax %</th>
                  <th className="p-2 min-w-[120px]">Specs</th>
                  <th className="p-2 w-10 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                    <td className="p-2">
                      <Select
                        value={line.item}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        required
                        className="text-[11px] py-1"
                      >
                        <option value="">-- Select --</option>
                        {itemsList.map((itm) => (
                          <option key={itm._id} value={itm._id}>
                            {itm.itemName} ({itm.itemCode})
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="any"
                        min="0.0001"
                        value={line.quantity}
                        onChange={(e) => handleLineFieldChange(idx, 'quantity', e.target.value)}
                        required
                        className="text-right py-1"
                      />
                    </td>
                    <td className="p-2">
                      <Select
                        value={line.uom}
                        onChange={(e) => handleLineFieldChange(idx, 'uom', e.target.value)}
                        required
                        className="text-[11px] py-1"
                      >
                        <option value="">-- UOM --</option>
                        {uomsList.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.uomCode}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={line.unitRate}
                        onChange={(e) => handleLineFieldChange(idx, 'unitRate', e.target.value)}
                        required
                        className="text-right py-1"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={line.discount}
                        onChange={(e) => handleLineFieldChange(idx, 'discount', e.target.value)}
                        className="text-right py-1"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={line.taxRate}
                        onChange={(e) => handleLineFieldChange(idx, 'taxRate', e.target.value)}
                        className="text-right py-1"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={line.specification}
                        onChange={(e) => handleLineFieldChange(idx, 'specification', e.target.value)}
                        className="py-1"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            <Save size={14} className="mr-1" />
            {loading ? 'Submitting...' : 'Issue Amendment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseOrderAmendmentModal;
