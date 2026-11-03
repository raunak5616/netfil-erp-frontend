import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Textarea } from '../../components/ui/FormField';
import {
  useGetWorkOrderSalesOrderPreviewQuery,
  useCreateWorkOrderMutation
} from '../../features/workOrders/workOrdersApi';
import { printWorkOrderPdf } from '../../services/workOrderService';
import {
  Wrench,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  Printer,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Truck,
  CreditCard,
  User,
  Info
} from 'lucide-react';

const SalesOrderWorkOrderCreateModal = ({
  isOpen,
  salesOrderId,
  onClose,
  onSuccess
}) => {
  const {
    data: previewData,
    isLoading: loadingPreview,
    error: previewError,
    refetch: refetchPreview
  } = useGetWorkOrderSalesOrderPreviewQuery(salesOrderId, {
    skip: !isOpen || !salesOrderId,
  });

  const [createWorkOrder, { isLoading: submitting }] = useCreateWorkOrderMutation();

  // Local Form State
  const [customerPoNumber, setCustomerPoNumber] = useState('');
  const [customerPoDate, setCustomerPoDate] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Addresses
  const [billingAddress, setBillingAddress] = useState({
    customerName: '',
    address: '',
    contactPerson: '',
    contactNumber: '',
    email: ''
  });
  const [deliveryAddress, setDeliveryAddress] = useState({
    customerName: '',
    address: '',
    contactPerson: '',
    contactNumber: '',
    email: ''
  });

  // Commercial Terms
  const [commercialTerms, setCommercialTerms] = useState({
    paymentTerms: '',
    transportTerms: '',
    transportCharges: '',
    woodenPacking: '',
    requiredForms: '',
    freightNote: '',
    marketingPerson: { name: '', contactNumber: '', email: '' }
  });

  // Items Selection State: map of salesOrderItemId -> { selected: boolean, qty: number, remarks: string }
  const [itemSelections, setItemSelections] = useState({});
  const [formError, setFormError] = useState('');
  const [createdWO, setCreatedWO] = useState(null);

  // Sync state when preview data loads
  useEffect(() => {
    if (isOpen && previewData?.success) {
      setFormError('');
      setCreatedWO(null);

      const so = previewData.salesOrder || {};
      setCustomerPoNumber(previewData.customerPoNumber || so.customerPoNumber || '');
      setCustomerPoDate(previewData.customerPoDate ? previewData.customerPoDate.substring(0, 10) : '');
      setDispatchDate(previewData.dispatchDate ? previewData.dispatchDate.substring(0, 10) : '');

      if (previewData.billingAddress) {
        setBillingAddress(previewData.billingAddress);
      }
      if (previewData.deliveryAddress) {
        setDeliveryAddress(previewData.deliveryAddress);
      }
      if (previewData.commercialTerms) {
        setCommercialTerms(previewData.commercialTerms);
      }

      // Initialize items
      const initialMap = {};
      (previewData.items || []).forEach(it => {
        const avail = Number(it.availableQuantity) || 0;
        initialMap[it.salesOrderItemId] = {
          selected: avail > 0,
          qty: avail > 0 ? avail : 0,
          remarks: ''
        };
      });
      setItemSelections(initialMap);
    }
  }, [isOpen, previewData]);

  const previewItems = previewData?.items || [];

  // Computed summary
  const summary = useMemo(() => {
    let selectedCount = 0;
    let totalQty = 0;
    previewItems.forEach(it => {
      const state = itemSelections[it.salesOrderItemId];
      if (state && state.selected && Number(state.qty) > 0) {
        selectedCount++;
        totalQty += Number(state.qty);
      }
    });
    return { selectedCount, totalQty };
  }, [previewItems, itemSelections]);

  const handleToggleSelectAll = (select) => {
    const updated = { ...itemSelections };
    previewItems.forEach(it => {
      const avail = Number(it.availableQuantity) || 0;
      if (avail > 0) {
        updated[it.salesOrderItemId] = {
          ...(updated[it.salesOrderItemId] || {}),
          selected: select,
          qty: select ? avail : 0
        };
      }
    });
    setItemSelections(updated);
  };

  const handleItemSelectToggle = (id) => {
    const current = itemSelections[id] || { selected: false, qty: 0 };
    const item = previewItems.find(it => it.salesOrderItemId === id);
    const avail = item ? (Number(item.availableQuantity) || 0) : 0;
    const nextSelected = !current.selected;

    setItemSelections(prev => ({
      ...prev,
      [id]: {
        ...current,
        selected: nextSelected,
        qty: nextSelected ? (current.qty > 0 ? current.qty : avail) : 0
      }
    }));
  };

  const handleItemQtyChange = (id, val) => {
    const num = Number(val);
    const item = previewItems.find(it => it.salesOrderItemId === id);
    const avail = item ? (Number(item.availableQuantity) || 0) : 0;
    const current = itemSelections[id] || { selected: false, qty: 0 };

    const clamped = Math.max(0, Math.min(avail, Number.isNaN(num) ? 0 : num));

    setItemSelections(prev => ({
      ...prev,
      [id]: {
        ...current,
        selected: clamped > 0,
        qty: clamped
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (summary.selectedCount === 0 || summary.totalQty <= 0) {
      setFormError('Please select at least one item with a manufacturing quantity greater than 0.');
      return;
    }

    const payloadItems = [];
    for (const it of previewItems) {
      const state = itemSelections[it.salesOrderItemId];
      if (state && state.selected && Number(state.qty) > 0) {
        if (Number(state.qty) > it.availableQuantity) {
          setFormError(`Requested quantity (${state.qty}) for "${it.description}" exceeds available quantity (${it.availableQuantity}).`);
          return;
        }
        payloadItems.push({
          salesOrderItemId: it.salesOrderItemId,
          productionQuantity: Number(state.qty),
          remarks: state.remarks || ''
        });
      }
    }

    try {
      const result = await createWorkOrder({
        salesOrderId,
        customerPoNumber,
        customerPoDate: customerPoDate || null,
        dispatchDate: dispatchDate || null,
        billingAddress,
        deliveryAddress,
        commercialTerms,
        plannedStartDate: plannedStartDate || null,
        plannedEndDate: plannedEndDate || null,
        remarks,
        items: payloadItems
      }).unwrap();

      if (result.success && result.workOrder) {
        setCreatedWO(result.workOrder);
        if (onSuccess) onSuccess(result.workOrder);
      }
    } catch (err) {
      console.error('Work Order creation failed:', err);
      setFormError(err.data?.message || err.message || 'Failed to generate Work Order.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Wrench className="text-blue-600" size={20} />
          <span>
            Create Work Order — Sales Order{' '}
            <span className="font-mono font-bold text-blue-700">
              {previewData?.salesOrder?.salesOrderNo || ''}
            </span>
          </span>
        </div>
      }
      maxWidth="1100px"
      footer={
        createdWO ? (
          <div className="flex justify-between items-center w-full">
            <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Work Order created successfully!
            </span>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => printWorkOrderPdf(createdWO._id, createdWO.workOrderNo)}
              >
                <Printer size={15} className="mr-1.5" /> Print Work Order PDF
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center w-full">
            <div className="text-xs text-slate-500">
              Selected: <strong>{summary.selectedCount}</strong> items | Total Production Quantity:{' '}
              <strong className="text-blue-700 font-bold text-sm">{summary.totalQty} Nos</strong>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting || summary.totalQty <= 0}
              >
                <Wrench size={15} className="mr-1.5" />
                {submitting ? 'Generating...' : 'Generate Work Order'}
              </Button>
            </div>
          </div>
        )
      }
    >
      {formError && <Alert type="error" message={formError} onClose={() => setFormError('')} />}

      {loadingPreview ? (
        <div className="py-12 text-center text-slate-500">
          <div className="inline-block animate-spin mb-2">⚙️</div>
          <div>Loading Sales Order items and customer PO reference...</div>
        </div>
      ) : previewError ? (
        <Alert
          type="error"
          message={previewError.data?.message || 'Failed to load Sales Order preparation details'}
        />
      ) : createdWO ? (
        /* SUCCESS VIEW */
        <div className="py-8 px-4 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={36} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Work Order <span className="font-mono text-blue-700">{createdWO.workOrderNo}</span> Generated!
          </h3>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            The Work Order has been snapshotted directly from Sales Order{' '}
            <strong>{previewData?.salesOrder?.salesOrderNo}</strong> with Customer PO reference{' '}
            <strong className="text-slate-900">
              {createdWO.customerPoNumber || previewData?.customerPoNumber || 'N/A'}
            </strong>
            .
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-md mx-auto text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Work Order No:</span>
              <span className="font-mono font-bold text-slate-800">{createdWO.workOrderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer PO No:</span>
              <span className="font-semibold text-slate-800">{createdWO.customerPoNumber || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Production Quantity:</span>
              <span className="font-bold text-blue-700">{createdWO.productionQuantity} Nos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Manufacturing Status:</span>
              <span className="font-semibold text-amber-700">DRAFT (Ready for Release)</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => printWorkOrderPdf(createdWO._id, createdWO.workOrderNo)}
            >
              <Printer size={16} className="mr-2" /> Download Client-Format Work Order PDF
            </Button>
          </div>
        </div>
      ) : (
        /* FORM CREATION VIEW */
        <div className="space-y-5">
          {/* 1. Header Information Cards: PO Reference + Customer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Box 1: Customer PO Reference */}
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-md space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase">
                <FileText size={14} /> Customer PO Reference
              </div>
              <div className="space-y-1.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                    Customer PO No. *
                  </label>
                  <input
                    type="text"
                    value={customerPoNumber}
                    onChange={(e) => setCustomerPoNumber(e.target.value)}
                    placeholder="Enter customer PO number"
                    className="w-full text-xs font-mono font-semibold px-2 py-1 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                      PO Date
                    </label>
                    <input
                      type="date"
                      value={customerPoDate}
                      onChange={(e) => setCustomerPoDate(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                      Dispatch Date
                    </label>
                    <input
                      type="date"
                      value={dispatchDate}
                      onChange={(e) => setDispatchDate(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Client / Billing Address */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase">
                <Building2 size={14} /> Billing Details
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-900 truncate">
                  {billingAddress.customerName || previewData?.client?.companyName || '—'}
                </div>
                <div className="text-[11px] text-slate-600 line-clamp-2">
                  {billingAddress.address || '—'}
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Attn: <strong>{billingAddress.contactPerson || '—'}</strong> | Tel: {billingAddress.contactNumber || '—'}
                </div>
              </div>
            </div>

            {/* Box 3: Commercial & Delivery Terms */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase">
                <Truck size={14} /> Commercial Terms
              </div>
              <div className="text-[11px] space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment:</span>
                  <span className="font-medium truncate max-w-[140px]">{commercialTerms.paymentTerms || '100% Adv'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transport:</span>
                  <span className="font-medium truncate max-w-[140px]">{commercialTerms.transportTerms || 'Ex-Works'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Freight:</span>
                  <span className="font-medium truncate max-w-[140px]">{commercialTerms.transportCharges || 'To Pay'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Packing:</span>
                  <span className="font-medium truncate max-w-[140px]">{commercialTerms.woodenPacking || 'Standard'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Items Selection Section */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-blue-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Select Sales Order Items & Quantities to Manufacture
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleToggleSelectAll(true)}
                  type="button"
                >
                  Fill All Available
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleToggleSelectAll(false)}
                  type="button"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Sel</th>
                    <th className="p-2.5">Item Code & Description</th>
                    <th className="p-2.5">Filter Grade / Eff</th>
                    <th className="p-2.5 text-center">Dimensions (L × W × D)</th>
                    <th className="p-2.5 text-center">MOC & Temp</th>
                    <th className="p-2.5 text-center w-20">Ordered</th>
                    <th className="p-2.5 text-center w-20">Already in WO</th>
                    <th className="p-2.5 text-center w-20 bg-blue-50/50">Available</th>
                    <th className="p-2.5 text-center w-28 bg-emerald-50/60 text-emerald-900">
                      WO Quantity *
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewItems.map((it, idx) => {
                    const sel = itemSelections[it.salesOrderItemId] || { selected: false, qty: 0 };
                    const isFullyAllocated = it.availableQuantity <= 0;

                    return (
                      <tr
                        key={it.salesOrderItemId}
                        className={`transition-colors ${
                          sel.selected ? 'bg-blue-50/30' : isFullyAllocated ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={sel.selected}
                            disabled={isFullyAllocated}
                            onChange={() => handleItemSelectToggle(it.salesOrderItemId)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{it.description}</div>
                          {it.itemCode && (
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                              {it.itemCode}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-800">{it.filterGrade || '—'}</div>
                          <div className="text-[10px] text-slate-500">{it.efficiency || '—'}</div>
                        </td>
                        <td className="p-2.5 text-center font-mono text-[11px]">
                          {it.length && it.width ? `${it.length} × ${it.width}${it.depth ? ` × ${it.depth}` : ''} mm` : '—'}
                        </td>
                        <td className="p-2.5 text-center text-[11px]">
                          <div>{it.moc || '—'}</div>
                          {it.temp && <div className="text-[10px] text-slate-500">{it.temp} °C</div>}
                        </td>
                        <td className="p-2.5 text-center font-semibold text-slate-700">
                          {it.orderedQuantity} {it.uomCode}
                        </td>
                        <td className="p-2.5 text-center text-slate-500">
                          {it.alreadyAllocatedQuantity} {it.uomCode}
                        </td>
                        <td className="p-2.5 text-center font-bold text-blue-700 bg-blue-50/30">
                          {it.availableQuantity} {it.uomCode}
                        </td>
                        <td className="p-2.5 text-center bg-emerald-50/30">
                          <input
                            type="number"
                            min="0"
                            max={it.availableQuantity}
                            step="any"
                            value={sel.qty || ''}
                            disabled={!sel.selected}
                            onChange={(e) => handleItemQtyChange(it.salesOrderItemId, e.target.value)}
                            className={`w-20 text-center font-bold text-xs py-1 border rounded ${
                              sel.selected
                                ? 'border-emerald-500 bg-white text-emerald-900 focus:ring-emerald-500'
                                : 'border-slate-200 bg-slate-100 text-slate-400'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Total Bar */}
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                Total Products in Sales Order: <strong>{previewItems.length}</strong>
              </span>
              <div className="flex gap-4">
                <span>
                  Manufacturing Items: <strong>{summary.selectedCount}</strong>
                </span>
                <span>
                  Total WO Quantity:{' '}
                  <strong className="text-emerald-700 font-bold text-sm">
                    {summary.totalQty} Nos
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* 3. Planning & Additional Remarks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Start Date
              </label>
              <input
                type="date"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Completion Date
              </label>
              <input
                type="date"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Production / Shop Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Special manufacturing instructions..."
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SalesOrderWorkOrderCreateModal;

