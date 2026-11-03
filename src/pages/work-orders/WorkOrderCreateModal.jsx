import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Select, Input, Textarea } from '../../components/ui/FormField';
import { useGetOrderBOMsQuery, useGetOrderBOMByIdQuery } from '../../features/boms/bomsApi';
import { useGetPlantsQuery } from '../../features/masterData/masterDataApi';
import { useGetSalesOrdersQuery } from '../../features/salesOrders/salesOrdersApi';
import {
  useCreateWorkOrderMutation,
  useGetWorkOrderSalesOrderPreviewQuery
} from '../../features/workOrders/workOrdersApi';
import { printWorkOrderPdf } from '../../services/workOrderService';
import {
  FileCheck,
  Wrench,
  Building2,
  Calendar,
  Printer,
  Package,
  Truck,
  FileText,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';

const WorkOrderCreateModal = ({ isOpen, initialOrderBOM = null, onClose, onSuccess }) => {
  // Mode: 'SALES_ORDER' (direct PO flow) | 'BOM' (legacy Order BOM)
  const [mode, setMode] = useState(initialOrderBOM ? 'BOM' : 'SALES_ORDER');

  useEffect(() => {
    if (initialOrderBOM) {
      setMode('BOM');
    }
  }, [initialOrderBOM]);

  // =========================================================================
  // SHARED & MUTATION
  // =========================================================================
  const [error, setError] = useState('');
  const [createWorkOrder, { isLoading: submitting }] = useCreateWorkOrderMutation();
  const [createdWO, setCreatedWO] = useState(null);

  // Common Plant & Sales Order Lists
  const { data: plantListData } = useGetPlantsQuery(
    { status: 'active' },
    { skip: !isOpen }
  );
  const plants = plantListData?.plants || [];

  const { data: soListData, isLoading: loadingSOList } = useGetSalesOrdersQuery(
    { limit: 100 },
    { skip: !isOpen || mode !== 'SALES_ORDER' }
  );
  const salesOrders = useMemo(() => {
    return (soListData?.salesOrders || []).filter(s => s.status !== 'cancelled');
  }, [soListData]);

  // =========================================================================
  // MODE 1: DIRECT FROM SALES ORDER (PO Flow)
  // =========================================================================
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState('');
  const [customerPoNumber, setCustomerPoNumber] = useState('');
  const [customerPoDate, setCustomerPoDate] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [soPlannedStartDate, setSoPlannedStartDate] = useState('');
  const [soPlannedEndDate, setSoPlannedEndDate] = useState('');
  const [soRemarks, setSoRemarks] = useState('');
  const [soPlantId, setSoPlantId] = useState('');

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
  const [commercialTerms, setCommercialTerms] = useState({
    paymentTerms: '',
    transportTerms: '',
    transportCharges: '',
    woodenPacking: '',
    requiredForms: '',
    freightNote: '',
    marketingPerson: { name: '', contactNumber: '', email: '' }
  });

  // Items selection map: salesOrderItemId -> { selected: boolean, qty: number, remarks: string }
  const [itemSelections, setItemSelections] = useState({});

  // RTK Query for Sales Order Preview
  const {
    data: previewData,
    isLoading: loadingPreview,
    error: previewError
  } = useGetWorkOrderSalesOrderPreviewQuery(selectedSalesOrderId, {
    skip: !isOpen || mode !== 'SALES_ORDER' || !selectedSalesOrderId
  });

  useEffect(() => {
    if (selectedSalesOrderId && previewData?.success) {
      setError('');
      const so = previewData.salesOrder || {};
      setCustomerPoNumber(previewData.customerPoNumber || so.customerPoNumber || '');
      setCustomerPoDate(previewData.customerPoDate ? previewData.customerPoDate.substring(0, 10) : '');
      setDispatchDate(previewData.dispatchDate ? previewData.dispatchDate.substring(0, 10) : '');

      if (previewData.billingAddress) setBillingAddress(previewData.billingAddress);
      if (previewData.deliveryAddress) setDeliveryAddress(previewData.deliveryAddress);
      if (previewData.commercialTerms) setCommercialTerms(previewData.commercialTerms);

      const initialMap = {};
      (previewData.items || []).forEach((it) => {
        const avail = Number(it.availableQuantity) || 0;
        initialMap[it.salesOrderItemId] = {
          selected: avail > 0,
          qty: avail > 0 ? avail : 0,
          remarks: ''
        };
      });
      setItemSelections(initialMap);
    }
  }, [selectedSalesOrderId, previewData]);

  const previewItems = previewData?.items || [];

  const directSoSummary = useMemo(() => {
    let selectedCount = 0;
    let totalQty = 0;
    previewItems.forEach((it) => {
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
    previewItems.forEach((it) => {
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
    const item = previewItems.find((it) => it.salesOrderItemId === id);
    const avail = item ? Number(item.availableQuantity) || 0 : 0;
    const nextSelected = !current.selected;

    setItemSelections((prev) => ({
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
    const item = previewItems.find((it) => it.salesOrderItemId === id);
    const avail = item ? Number(item.availableQuantity) || 0 : 0;
    const current = itemSelections[id] || { selected: false, qty: 0 };
    const clamped = Math.max(0, Math.min(avail, Number.isNaN(num) ? 0 : num));

    setItemSelections((prev) => ({
      ...prev,
      [id]: {
        ...current,
        selected: clamped > 0,
        qty: clamped
      }
    }));
  };

  // =========================================================================
  // MODE 2: FROM ORDER BOM
  // =========================================================================
  const [selectedOrderBOMId, setSelectedOrderBOMId] = useState('');
  const [selectedOrderBOM, setSelectedOrderBOM] = useState(null);
  const [obomComponents, setObomComponents] = useState([]);
  const [bomProductionQuantity, setBomProductionQuantity] = useState('');
  const [bomSelectedPlantId, setBomSelectedPlantId] = useState('');
  const [bomPlannedStartDate, setBomPlannedStartDate] = useState('');
  const [bomPlannedEndDate, setBomPlannedEndDate] = useState('');
  const [bomRemarks, setBomRemarks] = useState('');

  const { data: obomListData, isLoading: loadingOBOMs } = useGetOrderBOMsQuery(
    { status: 'RECEIVED_BY_FACTORY', limit: 100 },
    { skip: !isOpen || mode !== 'BOM' }
  );
  const orderBOMs = obomListData?.orderBOMs || [];

  const { data: selectedOBOMData, isFetching: loadingDetail } = useGetOrderBOMByIdQuery(
    selectedOrderBOMId,
    { skip: !selectedOrderBOMId || !isOpen || mode !== 'BOM' }
  );

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setCreatedWO(null);
    if (initialOrderBOM) {
      setMode('BOM');
      setSelectedOrderBOMId(initialOrderBOM._id || '');
    }
  }, [isOpen, initialOrderBOM]);

  useEffect(() => {
    if (!selectedOrderBOMId) {
      setSelectedOrderBOM(null);
      setObomComponents([]);
      setBomProductionQuantity('');
      setBomSelectedPlantId('');
      return;
    }

    if (selectedOBOMData?.success && selectedOBOMData.orderBOM) {
      const obom = selectedOBOMData.orderBOM;
      setSelectedOrderBOM(obom);
      setObomComponents(selectedOBOMData.items || []);
      setBomProductionQuantity(obom.orderQuantity || '');
      if (obom.plant?._id || obom.plant) {
        setBomSelectedPlantId(obom.plant._id || obom.plant);
      }
    }
  }, [selectedOrderBOMId, selectedOBOMData]);

  // =========================================================================
  // SUBMISSION HANDLER
  // =========================================================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (mode === 'SALES_ORDER') {
      if (!selectedSalesOrderId) {
        setError('Please select a Sales Order');
        return;
      }

      if (directSoSummary.selectedCount === 0 || directSoSummary.totalQty <= 0) {
        setError('Please select at least one item with a manufacturing quantity greater than 0');
        return;
      }

      const payloadItems = [];
      for (const it of previewItems) {
        const state = itemSelections[it.salesOrderItemId];
        if (state && state.selected && Number(state.qty) > 0) {
          if (Number(state.qty) > it.availableQuantity) {
            setError(`Requested quantity (${state.qty}) for "${it.description}" exceeds available quantity (${it.availableQuantity})`);
            return;
          }
          payloadItems.push({
            salesOrderItemId: it.salesOrderItemId,
            productionQuantity: Number(state.qty),
            remarks: state.remarks || ''
          });
        }
      }

      const payload = {
        salesOrderId: selectedSalesOrderId,
        plantId: soPlantId || undefined,
        customerPoNumber: customerPoNumber.trim(),
        customerPoDate: customerPoDate || null,
        dispatchDate: dispatchDate || null,
        billingAddress,
        deliveryAddress,
        commercialTerms,
        plannedStartDate: soPlannedStartDate || null,
        plannedEndDate: soPlannedEndDate || null,
        remarks: soRemarks.trim(),
        items: payloadItems
      };

      try {
        const result = await createWorkOrder(payload).unwrap();
        if (result.success && result.workOrder) {
          setCreatedWO(result.workOrder);
          if (onSuccess) onSuccess(result.workOrder);
        } else {
          setError(result.message || 'Failed to generate Work Order');
        }
      } catch (err) {
        console.error('Work Order creation error:', err);
        setError(err.data?.message || err.message || 'Server error creating Work Order');
      }

    } else {
      // BOM Submission
      if (!selectedOrderBOMId || !selectedOrderBOM) {
        setError('Please select an Order BOM');
        return;
      }

      const qty = Number(bomProductionQuantity);
      if (!bomProductionQuantity || Number.isNaN(qty) || qty <= 0) {
        setError('Production quantity must be a positive number greater than 0');
        return;
      }

      const salesOrderId = selectedOrderBOM.salesOrder?._id || selectedOrderBOM.salesOrder;
      const salesOrderItemId = selectedOrderBOM.salesOrderItem?._id || selectedOrderBOM.salesOrderItem;
      const targetPlantId = bomSelectedPlantId || selectedOrderBOM.plant?._id || selectedOrderBOM.plant;

      if (!targetPlantId) {
        setError('Please select a target Factory Plant');
        return;
      }

      const payload = {
        salesOrderId,
        salesOrderItemId,
        orderBOMId: selectedOrderBOM._id,
        productionQuantity: qty,
        plantId: targetPlantId,
        plannedStartDate: bomPlannedStartDate || undefined,
        plannedEndDate: bomPlannedEndDate || undefined,
        remarks: bomRemarks.trim()
      };

      try {
        const res = await createWorkOrder(payload).unwrap();
        if (res.success || res.workOrder) {
          setCreatedWO(res.workOrder || res);
          if (onSuccess) onSuccess(res.workOrder || res);
        } else {
          setError(res.message || 'Failed to create Work Order');
        }
      } catch (err) {
        console.error('Create Work Order error:', err);
        if (err.status === 409 || err.originalStatus === 409) {
          setError(err.data?.message || 'An active Work Order already exists for this Order BOM.');
        } else {
          setError(err.data?.message || 'Server error creating Work Order');
        }
      }
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
          <span>Create Work Order (Manufacturing Job)</span>
        </div>
      }
      maxWidth="1080px"
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
              {mode === 'SALES_ORDER' ? (
                <>
                  Selected: <strong>{directSoSummary.selectedCount}</strong> items | Total Production Quantity:{' '}
                  <strong className="text-blue-700 font-bold text-sm">{directSoSummary.totalQty} Nos</strong>
                </>
              ) : (
                <>Source: Factory Order BOM</>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  (mode === 'SALES_ORDER' ? directSoSummary.totalQty <= 0 : !selectedOrderBOMId)
                }
              >
                <Wrench size={15} className="mr-1.5" />
                {submitting ? 'Generating...' : 'Generate Work Order'}
              </Button>
            </div>
          </div>
        )
      }
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {createdWO ? (
        /* SUCCESS VIEW */
        <div className="py-8 px-4 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={36} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Work Order <span className="font-mono text-blue-700">{createdWO.workOrderNo}</span> Generated!
          </h3>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            The Work Order has been snapshotted directly with Customer PO reference{' '}
            <strong className="text-slate-900">
              {createdWO.customerPoNumber || 'N/A'}
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
              <span className="text-slate-500">Planned Quantity:</span>
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
        <div className="space-y-4">
          {/* Workflow Mode Tabs */}
          <div className="flex border-b border-slate-200 gap-4">
            <button
              type="button"
              onClick={() => setMode('SALES_ORDER')}
              className={`pb-2 px-1 font-bold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
                mode === 'SALES_ORDER'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText size={14} />
              Direct from Sales Order (PO Reference — No BOM Required)
            </button>
            <button
              type="button"
              onClick={() => setMode('BOM')}
              className={`pb-2 px-1 font-bold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
                mode === 'BOM'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers size={14} />
              From Order BOM (Factory Production)
            </button>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: DIRECT SALES ORDER WORKFLOW */}
          {/* ================================================================= */}
          {mode === 'SALES_ORDER' && (
            <div className="space-y-4">
              {/* Step 1: Select Sales Order */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Sales Order (with Customer PO Reference) *
                </label>
                <select
                  value={selectedSalesOrderId}
                  onChange={(e) => setSelectedSalesOrderId(e.target.value)}
                  disabled={loadingSOList || submitting}
                  className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="">-- Choose Confirmed Sales Order --</option>
                  {salesOrders.map((so) => (
                    <option key={so._id} value={so._id}>
                      {so.salesOrderNo} — {so.client?.companyName || 'Customer'} (PO: {so.customerPoNumber || 'No PO'}) [Status: {so.status}]
                    </option>
                  ))}
                </select>
              </div>

              {loadingPreview && (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Loading Sales Order items and customer PO reference...
                </div>
              )}

              {previewError && (
                <Alert
                  type="error"
                  message={previewError.data?.message || 'Failed to load Sales Order preparation details'}
                />
              )}

              {selectedSalesOrderId && previewData && !loadingPreview && (
                <>
                  {/* PO Reference + Billing + Commercial Terms Grid */}
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

                  {/* Items Selection Section */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200">
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

                    <div className="overflow-x-auto max-h-[260px]">
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
                          {previewItems.map((it) => {
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
                                    className="w-20 text-center font-bold text-blue-900 px-2 py-1 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Production Schedule & Remarks */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField label="Planned Start Date">
                      <Input
                        type="date"
                        value={soPlannedStartDate}
                        onChange={(e) => setSoPlannedStartDate(e.target.value)}
                        disabled={submitting}
                      />
                    </FormField>

                    <FormField label="Planned Completion Date">
                      <Input
                        type="date"
                        value={soPlannedEndDate}
                        onChange={(e) => setSoPlannedEndDate(e.target.value)}
                        disabled={submitting}
                      />
                    </FormField>

                    <FormField label="Target Plant (Factory)">
                      <Select
                        value={soPlantId}
                        onChange={(e) => setSoPlantId(e.target.value)}
                        disabled={submitting}
                      >
                        <option value="">-- Default Plant --</option>
                        {plants.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.plantCode} — {p.plantName}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>

                  <FormField label="Remarks / Production Notes">
                    <Textarea
                      rows={2}
                      placeholder="Add specific instructions for shop floor..."
                      value={soRemarks}
                      onChange={(e) => setSoRemarks(e.target.value)}
                      disabled={submitting}
                    />
                  </FormField>
                </>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: FROM ORDER BOM */}
          {/* ================================================================= */}
          {mode === 'BOM' && (
            <div className="space-y-4">
              <div style={{ fontSize: '12.5px', color: 'var(--neutral-600)', background: 'var(--neutral-50)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                Work Order generates a <strong>manufacturing job</strong> derived from a routed Order BOM in <code>RECEIVED_BY_FACTORY</code> status. Component requirements will be snapshotted automatically.
              </div>

              {/* Step 1: Select Order BOM */}
              <div className="form-grid">
                <FormField label="1. Select Order BOM (Factory Received)" required className="full-width">
                  <Select
                    value={selectedOrderBOMId}
                    onChange={(e) => setSelectedOrderBOMId(e.target.value)}
                    disabled={loadingOBOMs || submitting}
                    required
                  >
                    <option value="">-- Select Factory-Received Order BOM --</option>
                    {orderBOMs.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.orderBOMCode} — SO: {b.salesOrder?.salesOrderNo || 'N/A'} ({b.parentItem?.itemName || 'Product'}) [Qty: {b.orderQuantity}]
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              {/* Loaded Order BOM Details & Production Inputs */}
              {selectedOrderBOM && (
                <>
                  <div style={{ background: 'var(--primary-50, #f0f7ff)', border: '1px solid var(--primary-200, #bae0ff)', borderRadius: '6px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-900)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileCheck size={14} /> Work Order Pre-Generation Context
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12.5px' }}>
                      <div>
                        <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Order BOM:</span>
                        <strong style={{ color: 'var(--neutral-900)' }} className="font-mono">{selectedOrderBOM.orderBOMCode}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Sales Order & Party:</span>
                        <strong style={{ color: 'var(--neutral-900)' }}>{selectedOrderBOM.salesOrder?.salesOrderNo || 'N/A'}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--neutral-600)' }}>
                          {selectedOrderBOM.salesOrder?.client?.companyName || selectedOrderBOM.salesOrder?.client?.clientCode || ''}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Parent Product:</span>
                        <strong style={{ color: 'var(--neutral-900)' }}>{selectedOrderBOM.parentItem?.itemName || 'Finished Item'}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }} className="font-mono">
                          {selectedOrderBOM.parentItem?.itemCode}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Source Master BOM:</span>
                        <strong style={{ color: 'var(--neutral-900)' }}>{selectedOrderBOM.masterBOM?.bomCode || 'BOM'} (v{selectedOrderBOM.masterBOMVersion || 1})</strong>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid">
                    <FormField label="Planned Production Quantity" required>
                      <Input
                        type="number"
                        step="any"
                        min="0.0001"
                        value={bomProductionQuantity}
                        onChange={(e) => setBomProductionQuantity(e.target.value)}
                        placeholder="Enter production quantity"
                        disabled={submitting}
                        required
                      />
                    </FormField>

                    <FormField label="Target Plant (Factory)" required>
                      <Select
                        value={bomSelectedPlantId}
                        onChange={(e) => setBomSelectedPlantId(e.target.value)}
                        disabled={submitting}
                        required
                      >
                        <option value="">-- Select Plant --</option>
                        {plants.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.plantCode} — {p.plantName}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField label="Planned Start Date">
                      <Input
                        type="date"
                        value={bomPlannedStartDate}
                        onChange={(e) => setBomPlannedStartDate(e.target.value)}
                        disabled={submitting}
                      />
                    </FormField>

                    <FormField label="Planned Completion Date">
                      <Input
                        type="date"
                        value={bomPlannedEndDate}
                        onChange={(e) => setBomPlannedEndDate(e.target.value)}
                        disabled={submitting}
                      />
                    </FormField>

                    <FormField label="Remarks / Production Instructions" className="full-width">
                      <Textarea
                        rows={2}
                        placeholder="Add manufacturing instructions or shop floor notes..."
                        value={bomRemarks}
                        onChange={(e) => setBomRemarks(e.target.value)}
                        disabled={submitting}
                      />
                    </FormField>
                  </div>

                  {obomComponents.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: '6px' }}>
                        Component Requirements Snapshot (Calculated for {bomProductionQuantity || 0} {selectedOrderBOM.uom?.uomCode || 'Nos'})
                      </div>
                      <div className="overflow-x-auto border border-slate-200 rounded bg-white" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        <table className="w-full border-collapse text-left text-[13px] whitespace-nowrap">
                          <thead>
                            <tr>
                              <th>Component Item</th>
                              <th style={{ textAlign: 'right' }}>Qty / Parent</th>
                              <th style={{ textAlign: 'right' }}>Calculated Required Qty</th>
                              <th>UOM</th>
                              <th>Tag</th>
                            </tr>
                          </thead>
                          <tbody>
                            {obomComponents.map((cItem, idx) => {
                              const qtyPerParent = Number(cItem.quantityPerParent || 0);
                              const calculatedReq = Number((qtyPerParent * (Number(bomProductionQuantity) || 0)).toFixed(6));
                              return (
                                <tr key={cItem._id || idx}>
                                  <td>
                                    <div style={{ fontWeight: 600 }}>{cItem.componentItem?.itemName || 'Component'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }} className="font-mono">
                                      {cItem.componentItem?.itemCode || 'N/A'}
                                    </div>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{qtyPerParent}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-700)' }}>
                                    {calculatedReq}
                                  </td>
                                  <td>{cItem.uom?.uomCode || cItem.uom?.uomName || '-'}</td>
                                  <td>{cItem.positionTag || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default WorkOrderCreateModal;
