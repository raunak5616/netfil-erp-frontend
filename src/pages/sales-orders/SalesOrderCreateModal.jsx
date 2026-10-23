import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Textarea, FormField } from '../../components/ui/FormField';
import { getQuotations, getQuotationById } from '../../services/quotationService';
import { createSalesOrder } from '../../services/salesOrderService';
import { 
  Search, 
  Calculator, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  X, 
  Check, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  Plus,
  Trash2
} from 'lucide-react';
import QuotationChangesModal from './components/QuotationChangesModal';
import { compareQuotationWithSalesOrder } from '../../utils/quotationComparator';

const SalesOrderCreateModal = ({ isOpen, onClose, onSuccess }) => {
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [eligibleQuotations, setEligibleQuotations] = useState([]);
  const [quotationSearch, setQuotationSearch] = useState('');

  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form Fields - PO & Dates (SO-only fields)
  const [customerPoNumber, setCustomerPoNumber] = useState('');
  const [customerPoDate, setCustomerPoDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Editable Terms & Charges
  const [orderType, setOrderType] = useState('domestic');
  const [orderCategory, setOrderCategory] = useState('product');
  const [currency, setCurrency] = useState('INR');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [generalTerms, setGeneralTerms] = useState('');
  const [pfAmount, setPfAmount] = useState(0);
  const [freightAmount, setFreightAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxName, setTaxName] = useState('GST');
  const [taxRate, setTaxRate] = useState(0);

  // Editable Line Items
  const [lineItems, setLineItems] = useState([]);
  const [expandedItemIndex, setExpandedItemIndex] = useState(null);

  // Change Detection & Confirmation State
  const [detectedChanges, setDetectedChanges] = useState([]);
  const [showChangesModal, setShowChangesModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch eligible quotations (status: accepted or released)
  useEffect(() => {
    if (!isOpen) return;

    const fetchEligible = async () => {
      setLoadingEligible(true);
      setError('');
      try {
        const res = await getQuotations({ eligibleForSalesOrder: 'true' });

        let list = [];
        if (res.success && Array.isArray(res.quotations)) {
          list = res.quotations;
        }

        // De-duplicate by _id and strictly exclude any quotation with existing salesOrder or terminal status
        const uniqueMap = new Map();
        list.forEach((q) => {
          if (!q || !q._id) return;
          if (q.salesOrder) return;
          const statusLower = (q.status || '').toLowerCase();
          if (['won', 'converted', 'lost', 'cancelled'].includes(statusLower)) return;
          uniqueMap.set(q._id, q);
        });

        setEligibleQuotations(Array.from(uniqueMap.values()));
      } catch (err) {
        console.error('Failed to load eligible quotations:', err);
        setError('Failed to load eligible quotations from server.');
      } finally {
        setLoadingEligible(false);
      }
    };

    fetchEligible();
  }, [isOpen]);

  // Load detailed quotation when selected
  const handleSelectQuotation = async (qId) => {
    if (selectedQuotationId === qId) return;
    setSelectedQuotationId(qId);
    if (!qId) {
      setSelectedQuotationDetails(null);
      setLineItems([]);
      return;
    }

    setLoadingDetails(true);
    setError('');
    try {
      const res = await getQuotationById(qId);
      if (res.success && res.quotation) {
        const qDoc = res.quotation;
        const items = res.items || [];
        setSelectedQuotationDetails({
          header: qDoc,
          items: items
        });

        // Initialize editable line items
        setLineItems(
          items.map((it) => ({
            ...it,
            quantity: it.quantity !== undefined ? it.quantity : 1,
            unitPrice: it.unitPrice !== undefined ? it.unitPrice : 0,
            lineTotal: it.lineTotal !== undefined ? it.lineTotal : (Number(it.quantity || 1) * Number(it.unitPrice || 0)),
            constructionType: it.constructionType || (it.dimensions?.flangeWidth ? 'FLANGE' : 'BOX'),
            flangeDesign: it.flangeDesign || null,
            flangeDesignSnapshot: it.flangeDesignSnapshot || null,
            drawing: it.drawing?._id || it.drawing || null,
            drawingSnapshot: it.drawingSnapshot || null,
            filterGrade: it.filterGrade?._id || it.filterGrade || it.item?.filterGrade?._id || it.item?.filterGrade || null,
            filterGradeName: it.filterGrade?.filterGrade || it.item?.filterGrade?.filterGrade || it.drawingSnapshot?.filterGradeName || '',
            hsnCode: it.hsnCode || it.dimensions?.hsnCode || '',
            dimensions: it.dimensions ? { ...it.dimensions } : {},
            specifications: Array.isArray(it.specifications) ? [...it.specifications] : []
          }))
        );

        // Pre-fill terms & commercial values from quotation
        setOrderType(qDoc.quotationType || 'domestic');
        setOrderCategory(qDoc.quotationCategory || 'product');
        setCurrency(qDoc.currency || 'INR');
        setPaymentTerms(qDoc.paymentTerms || '');
        setDeliveryTerms(qDoc.deliveryTerms || '');
        setGeneralTerms(qDoc.generalTerms || '');
        setPfAmount(qDoc.pfAmount || 0);
        setFreightAmount(qDoc.freightAmount || 0);
        setDiscountAmount(qDoc.discountAmount || 0);
        setTaxName(qDoc.taxName || 'GST');
        setTaxRate(qDoc.taxRate !== undefined ? qDoc.taxRate : 18);

        // Pre-fill SO remarks & delivery date
        if (qDoc.remarks) setRemarks(qDoc.remarks);
        if (qDoc.validTill) {
          setExpectedDeliveryDate(new Date(qDoc.validTill).toISOString().split('T')[0]);
        }
      } else {
        setError('Could not load selected quotation details.');
      }
    } catch (err) {
      console.error('Failed to load quotation details:', err);
      setError(err.response?.data?.message || 'Error fetching quotation details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle line item quantity or unit price edits
  const handleItemFieldChange = (index, field, value) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item[field] = value;

      const qty = field === 'quantity' ? (Number(value) || 0) : Number(item.quantity || 0);
      const rate = field === 'unitPrice' ? (Number(value) || 0) : Number(item.unitPrice || 0);
      item.lineTotal = qty * rate;

      updated[index] = item;
      return updated;
    });
  };

  // Handle item technical dimension change
  const handleItemDimensionChange = (index, dimKey, val) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.dimensions = {
        ...item.dimensions,
        [dimKey]: val
      };
      updated[index] = item;
      return updated;
    });
  };

  // Helper to extract or set specification value
  const getItemSpecValue = (item, keys) => {
    const specs = item?.specifications || [];
    const normalizedKeys = keys.map((k) => k.toLowerCase().replace(/[\s_-]/g, ''));
    if (Array.isArray(specs)) {
      for (const s of specs) {
        const rawName = s.name || s.key || s.parameterName || '';
        const cleanName = rawName.toLowerCase().replace(/[\s_-]/g, '');
        if (cleanName && normalizedKeys.some((nk) => cleanName.includes(nk) || nk.includes(cleanName))) {
          return s.value !== undefined ? String(s.value) : '';
        }
      }
    }
    return '';
  };

  const handleItemSpecChange = (index, keyName, value) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const specs = Array.isArray(item.specifications) ? [...item.specifications] : [];
      const cleanKey = keyName.toLowerCase().replace(/[\s_-]/g, '');

      const existingIdx = specs.findIndex((s) => {
        const raw = s.name || s.key || s.parameterName || '';
        return raw.toLowerCase().replace(/[\s_-]/g, '') === cleanKey;
      });

      if (existingIdx !== -1) {
        specs[existingIdx] = { ...specs[existingIdx], value };
      } else {
        specs.push({ key: keyName, name: keyName, value });
      }

      item.specifications = specs;
      updated[index] = item;
      return updated;
    });
  };

  // Item removal from Sales Order
  const handleRemoveItem = (index) => {
    if (lineItems.length <= 1) {
      setError('A Sales Order must have at least one line item.');
      return;
    }
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
    if (expandedItemIndex === index) {
      setExpandedItemIndex(null);
    }
  };

  // Item addition to Sales Order
  const handleAddItem = () => {
    const newItem = {
      _id: `custom_${Date.now()}`,
      description: 'Custom Added Filter Unit',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0,
      uom: null,
      constructionType: 'BOX',
      flangeDesign: null,
      hsnCode: '84213990',
      dimensions: {
        width: 610,
        height: 610,
        depth: 292
      },
      specifications: [
        { key: 'moc', name: 'MOC', value: 'Galvanized Iron' }
      ],
      remarks: '',
      sortOrder: lineItems.length
    };
    setLineItems((prev) => [...prev, newItem]);
    setExpandedItemIndex(lineItems.length);
  };

  // Live financial recalculation
  const liveTotals = useMemo(() => {
    const subtotal = lineItems.reduce((acc, it) => acc + (Number(it.lineTotal) || 0), 0);
    const pf = Number(pfAmount) || 0;
    const freight = Number(freightAmount) || 0;
    const discount = Number(discountAmount) || 0;
    const rate = Number(taxRate) || 0;

    const taxableAmount = Math.max(0, subtotal - discount + pf + freight);
    const taxAmount = rate > 0 ? (taxableAmount * rate) / 100 : 0;
    const grandTotal = Math.max(0, taxableAmount + taxAmount);

    return {
      subtotal,
      taxableAmount,
      taxAmount,
      grandTotal
    };
  }, [lineItems, pfAmount, freightAmount, discountAmount, taxRate]);

  const filteredQuotations = eligibleQuotations.filter((q) => {
    if (!quotationSearch.trim()) return true;
    const term = quotationSearch.toLowerCase();
    const qNo = q.quotationNo ? q.quotationNo.toLowerCase() : '';
    const partyName = q.client?.companyName ? q.client.companyName.toLowerCase() : '';
    const amt = q.grandTotal ? String(q.grandTotal) : '';
    return qNo.includes(term) || partyName.includes(term) || amt.includes(term);
  });

  // Construct complete payload for Sales Order creation
  const buildSalesOrderPayload = () => {
    return {
      quotation: selectedQuotationId,
      customerPoNumber: customerPoNumber.trim(),
      customerPoDate: customerPoDate || null,
      expectedDeliveryDate: expectedDeliveryDate || null,
      orderType,
      orderCategory,
      currency,
      paymentTerms: paymentTerms.trim(),
      deliveryTerms: deliveryTerms.trim(),
      generalTerms: generalTerms.trim(),
      remarks: remarks.trim(),
      pfAmount: Number(pfAmount) || 0,
      freightAmount: Number(freightAmount) || 0,
      discountAmount: Number(discountAmount) || 0,
      taxName: taxName.trim(),
      taxRate: Number(taxRate) || 0,
      taxableAmount: liveTotals.taxableAmount,
      taxAmount: liveTotals.taxAmount,
      subtotal: liveTotals.subtotal,
      grandTotal: liveTotals.grandTotal,
      items: lineItems.map((it, idx) => ({
        _id: it._id,
        item: it.item?._id || it.item,
        itemCategory: it.itemCategory?._id || it.itemCategory,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        lineTotal: Number(it.lineTotal) || 0,
        uom: it.uom?._id || it.uom,
        constructionType: it.constructionType || 'BOX',
        flangeDesign: it.flangeDesign?._id || it.flangeDesign || null,
        flangeDesignSnapshot: it.flangeDesignSnapshot || null,
        drawing: it.drawing?._id || it.drawing || null,
        drawingSnapshot: it.drawingSnapshot || null,
        filterGrade: it.filterGrade?._id || it.filterGrade || it.item?.filterGrade?._id || it.item?.filterGrade || null,
        dimensions: it.dimensions || {},
        specifications: it.specifications || [],
        remarks: it.remarks || '',
        hsnCode: it.hsnCode || '',
        sortOrder: it.sortOrder !== undefined ? it.sortOrder : idx
      }))
    };
  };

  // Perform backend creation request
  const executeCreateSalesOrder = async (payload) => {
    if (submitting) return; // Prevent duplicate creation on double click
    setSubmitting(true);
    setError('');
    try {
      const res = await createSalesOrder(payload);
      if (res.success) {
        setShowChangesModal(false);
        onSuccess();
      } else {
        setError(res.message || 'Failed to create Sales Order');
      }
    } catch (err) {
      console.error('Create Sales Order error:', err);
      setError(err.response?.data?.message || 'Server error while creating Sales Order');
    } finally {
      setSubmitting(false);
    }
  };

  // Intercept form submission to detect quotation changes
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedQuotationId || !selectedQuotationDetails) {
      setError('Please select an eligible accepted or released quotation.');
      return;
    }

    if (loadingDetails) {
      setError('Quotation details are currently loading. Please wait before submitting.');
      return;
    }

    if (!lineItems || lineItems.length === 0) {
      setError('Cannot create Sales Order: No line items found. Please select a quotation that contains line items.');
      return;
    }

    const payload = buildSalesOrderPayload();

    // Compare proposed Sales Order with authoritative source quotation
    const comparison = compareQuotationWithSalesOrder(
      selectedQuotationDetails.header,
      selectedQuotationDetails.items,
      payload
    );

    if (comparison.hasChanges && comparison.changes.length > 0) {
      // Differences detected: show warning confirmation dialog
      setDetectedChanges(comparison.changes);
      setShowChangesModal(true);
    } else {
      // No differences: continue directly with creation flow
      executeCreateSalesOrder(payload);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Create Sales Order from Quotation"
        size="xl"
      >
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Step 1: Eligible Quotation Picker */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <div className="p-1 rounded bg-blue-100 text-blue-600">
                  <Calculator size={15} />
                </div>
                <span>Step 1: Select Eligible Quotation</span>
              </h4>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {eligibleQuotations.length} {eligibleQuotations.length === 1 ? 'Quotation' : 'Quotations'} Available
              </span>
            </div>

            {loadingEligible ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
                Loading eligible accepted and released quotations...
              </div>
            ) : eligibleQuotations.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">No eligible quotations found.</span> Sales Orders can only be generated from quotations in <strong>ACCEPTED</strong> or <strong>RELEASED</strong> status. Please release or accept a quotation first.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Filter Input */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
                    placeholder="Filter by Quotation No, Client / Party Name, or Amount..."
                    value={quotationSearch}
                    onChange={(e) => setQuotationSearch(e.target.value)}
                  />
                  {quotationSearch && (
                    <button
                      type="button"
                      onClick={() => setQuotationSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Quotation Selection List Cards */}
                <div className="max-h-[190px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredQuotations.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
                      No quotation matching "{quotationSearch}"
                    </div>
                  ) : (
                    filteredQuotations.map((q) => {
                      const isSelected = selectedQuotationId === q._id;
                      const isAccepted = q.status?.toLowerCase() === 'accepted';
                      return (
                        <div
                          key={q._id}
                          onClick={() => handleSelectQuotation(q._id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check size={11} strokeWidth={3} />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-blue-700">{q.quotationNo}</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                  isAccepted
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {q.status ? q.status.toUpperCase() : 'ELIGIBLE'}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                                {q.client?.companyName || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-bold text-slate-900">
                              ₹{(q.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {q.quotationDate ? new Date(q.quotationDate).toLocaleDateString('en-IN') : 'Date N/A'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Loading details feedback */}
          {loadingDetails && (
            <div className="p-4 text-center text-xs text-slate-500 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Loading quotation commercial breakdown...
            </div>
          )}

          {/* Step 2: Line Items & Commercial Breakdown */}
          {selectedQuotationDetails && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-xs p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-100 text-blue-600">
                    <FileText size={15} />
                  </div>
                  <span>Step 2: Quotation Items & Commercial Details</span>
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Item</span>
                  </button>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                    {selectedQuotationDetails.header.status}
                  </span>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <div className="text-[11px] text-slate-500">Quotation No</div>
                  <div className="font-mono font-bold text-xs text-blue-700 mt-0.5">
                    {selectedQuotationDetails.header.quotationNo}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500">Party / Client</div>
                  <div className="font-semibold text-slate-900 mt-0.5 truncate">
                    {selectedQuotationDetails.header.client?.companyName || 'N/A'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500">Order Category & Type</div>
                  <div className="capitalize text-slate-800 mt-0.5">
                    {orderType} / {orderCategory} ({currency})
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500">Quotation Total</div>
                  <div className="font-bold text-xs text-slate-700 mt-0.5">
                    ₹{(selectedQuotationDetails.header.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Line Items Table with inline editing */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10.5px] font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 w-8">#</th>
                        <th className="px-3 py-2">Item / Description</th>
                        <th className="px-3 py-2 text-right w-24">Qty</th>
                        <th className="px-3 py-2 w-20">UOM</th>
                        <th className="px-3 py-2 text-right w-32">Rate (₹)</th>
                        <th className="px-3 py-2 text-right w-28">Line Total (₹)</th>
                        <th className="px-2 py-2 w-16 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {lineItems.map((item, idx) => {
                        const origItem = selectedQuotationDetails.items[idx];
                        const isQtyChanged = origItem && Number(origItem.quantity) !== Number(item.quantity);
                        const isRateChanged = origItem && Number(origItem.unitPrice) !== Number(item.unitPrice);
                        const isExpanded = expandedItemIndex === idx;

                        return (
                          <React.Fragment key={item._id || idx}>
                            <tr className={`hover:bg-slate-50/70 transition-colors ${isQtyChanged || isRateChanged ? 'bg-amber-50/30' : ''}`}>
                              <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                              <td className="px-3 py-2 font-medium">
                                <input
                                  type="text"
                                  className="w-full px-1.5 py-0.5 text-xs border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent font-medium text-slate-900 focus:bg-white"
                                  value={item.description || ''}
                                  onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                                  placeholder="Item description"
                                />
                                {item.item?.itemCode && (
                                  <div className="font-mono text-[10.5px] text-slate-500 pl-1.5">
                                    {item.item.itemCode}
                                  </div>
                                )}
                              </td>
                              {/* Quantity Input */}
                              <td className="px-3 py-2 text-right">
                                <div className="flex flex-col items-end">
                                  <input
                                    type="number"
                                    min="0.001"
                                    step="any"
                                    className={`w-20 px-2 py-1 text-right font-bold text-xs border rounded transition-all focus:outline-none focus:ring-1 ${
                                      isQtyChanged
                                        ? 'border-amber-400 bg-amber-50 text-amber-900 focus:border-amber-500 focus:ring-amber-200'
                                        : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-100'
                                    }`}
                                    value={item.quantity}
                                    onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                                  />
                                  {isQtyChanged && (
                                    <span className="text-[9.5px] text-amber-700 mt-0.5 font-medium">
                                      Quot: {origItem.quantity}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-3 py-2 text-slate-600">
                                {typeof item.uom === 'object' ? item.uom?.uomCode || item.uom?.uomName || item.uom?.unitSymbol || item.uom?.unitName : 'Units'}
                              </td>

                              {/* Unit Rate Input */}
                              <td className="px-3 py-2 text-right">
                                <div className="flex flex-col items-end">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    className={`w-28 px-2 py-1 text-right text-xs border rounded transition-all focus:outline-none focus:ring-1 ${
                                      isRateChanged
                                        ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold focus:border-amber-500 focus:ring-amber-200'
                                        : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-100'
                                    }`}
                                    value={item.unitPrice}
                                    onChange={(e) => handleItemFieldChange(idx, 'unitPrice', e.target.value)}
                                  />
                                  {isRateChanged && (
                                    <span className="text-[9.5px] text-amber-700 mt-0.5 font-medium">
                                      Quot: ₹{Number(origItem.unitPrice || 0).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Line Total */}
                              <td className="px-3 py-2 text-right font-bold text-slate-900">
                                ₹{(item.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>

                              {/* Actions: Toggle Specs + Delete Item */}
                              <td className="px-2 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedItemIndex(isExpanded ? null : idx)}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                    title="View / Edit Technical Specifications & Dimensions"
                                  >
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                    title="Remove Item from Sales Order"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Technical Specs Expandable Row */}
                            {isExpanded && (
                              <tr className="bg-slate-50/90">
                                <td colSpan={7} className="px-4 py-3.5 border-t border-b border-slate-200">
                                  <div className="space-y-3">
                                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <SlidersHorizontal size={13} className="text-blue-600" />
                                        <span>Technical & Dimension Specifications — Item #{idx + 1}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-normal">
                                        All edits are checked against quotation snapshot
                                      </span>
                                    </div>

                                    {/* Row 1: Construction & Dimensions */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Construction Type</label>
                                        <select
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={item.constructionType || 'BOX'}
                                          onChange={(e) => handleItemFieldChange(idx, 'constructionType', e.target.value)}
                                        >
                                          <option value="BOX">BOX</option>
                                          <option value="FLANGE">FLANGE</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">HSN Code</label>
                                        <input
                                          type="text"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={item.hsnCode || ''}
                                          onChange={(e) => handleItemFieldChange(idx, 'hsnCode', e.target.value)}
                                          placeholder="e.g. 84213990"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Body Width (mm)</label>
                                        <input
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={item.dimensions?.bodyWidth ?? item.dimensions?.width ?? ''}
                                          onChange={(e) => handleItemDimensionChange(idx, 'bodyWidth', e.target.value)}
                                          placeholder="610"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Body Height (mm)</label>
                                        <input
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={item.dimensions?.bodyHeight ?? item.dimensions?.height ?? ''}
                                          onChange={(e) => handleItemDimensionChange(idx, 'bodyHeight', e.target.value)}
                                          placeholder="610"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Depth / Length (mm)</label>
                                        <input
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={item.dimensions?.depth ?? item.dimensions?.length ?? ''}
                                          onChange={(e) => handleItemDimensionChange(idx, 'depth', e.target.value)}
                                          placeholder="292"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Airflow (CFM)</label>
                                        <input
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={item.dimensions?.cfm ?? ''}
                                          onChange={(e) => handleItemDimensionChange(idx, 'cfm', e.target.value)}
                                          placeholder="2000"
                                        />
                                      </div>
                                    </div>

                                    {/* Row 2: Flange Dimensions & Face Velocity */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Flange Width (mm)</label>
                                        <input
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={item.dimensions?.overallFlangeWidth ?? item.dimensions?.flangeWidth ?? ''}
                                          onChange={(e) => handleItemDimensionChange(idx, 'overallFlangeWidth', e.target.value)}
                                          placeholder="670"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Flange Height (mm)</label>
                                        <input
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={item.dimensions?.overallFlangeHeight ?? item.dimensions?.flangeHeight ?? ''}
                                          onChange={(e) => handleItemDimensionChange(idx, 'overallFlangeHeight', e.target.value)}
                                          placeholder="670"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Face Velocity (FPM)</label>
                                        <input
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={item.dimensions?.faceVelocity ?? ''}
                                          onChange={(e) => handleItemDimensionChange(idx, 'faceVelocity', e.target.value)}
                                          placeholder="500"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Outer Diameter (mm)</label>
                                        <input
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={item.dimensions?.outerDiameter ?? ''}
                                          onChange={(e) => handleItemDimensionChange(idx, 'outerDiameter', e.target.value)}
                                          placeholder="Dia"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Inner Diameter (mm)</label>
                                        <input
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={item.dimensions?.innerDiameter ?? ''}
                                          onChange={(e) => handleItemDimensionChange(idx, 'innerDiameter', e.target.value)}
                                          placeholder="Inner Dia"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">MOC / Frame Material</label>
                                        <input
                                          type="text"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={getItemSpecValue(item, ['moc', 'material'])}
                                          onChange={(e) => handleItemSpecChange(idx, 'moc', e.target.value)}
                                          placeholder="GI / SS 304"
                                        />
                                      </div>
                                    </div>

                                    {/* Row 3: Engineering Specs: Temp, Eff, Pressure Drops, Filter Grade, Bonding */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Temperature Rating</label>
                                        <input
                                          type="text"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={getItemSpecValue(item, ['temperature', 'temp'])}
                                          onChange={(e) => handleItemSpecChange(idx, 'temperature', e.target.value)}
                                          placeholder="120 °C"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Filtration Efficiency</label>
                                        <input
                                          type="text"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={getItemSpecValue(item, ['efficiency', 'eff'])}
                                          onChange={(e) => handleItemSpecChange(idx, 'efficiency', e.target.value)}
                                          placeholder="99.97% @ 0.3u"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Initial Pressure Drop</label>
                                        <input
                                          type="text"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={getItemSpecValue(item, ['initialPressureDrop', 'initial_pressure_drop', 'initial pd'])}
                                          onChange={(e) => handleItemSpecChange(idx, 'initialPressureDrop', e.target.value)}
                                          placeholder="250 Pa"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Final Pressure Drop</label>
                                        <input
                                          type="text"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={getItemSpecValue(item, ['finalPressureDrop', 'final_pressure_drop'])}
                                          onChange={(e) => handleItemSpecChange(idx, 'finalPressureDrop', e.target.value)}
                                          placeholder="500 Pa"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Filter Grade</label>
                                        <input
                                          type="text"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={getItemSpecValue(item, ['filterGrade', 'grade'])}
                                          onChange={(e) => handleItemSpecChange(idx, 'filterGrade', e.target.value)}
                                          placeholder="H13 / H14"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Bonding / Sealant</label>
                                        <input
                                          type="text"
                                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                          value={getItemSpecValue(item, ['bonding', 'sealant'])}
                                          onChange={(e) => handleItemSpecChange(idx, 'bonding', e.target.value)}
                                          placeholder="Polyurethane"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary & Commercial Charge Adjustments */}
              <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <span>Commercial Charges & Tax</span>
                  <span className="text-[10.5px] font-medium text-slate-500">Totals recalculate live</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10.5px] text-slate-500 block mb-0.5">P&F Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                      value={pfAmount}
                      onChange={(e) => setPfAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] text-slate-500 block mb-0.5">Freight Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                      value={freightAmount}
                      onChange={(e) => setFreightAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] text-slate-500 block mb-0.5">Discount Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] text-slate-500 block mb-0.5">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-slate-600 text-xs">
                    <span>Subtotal: <strong className="text-slate-800 font-mono">₹{liveTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                    <span>Taxable: <strong className="text-slate-800 font-mono">₹{liveTotals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                    <span>Tax ({taxName} {taxRate}%): <strong className="text-slate-800 font-mono">₹{liveTotals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-600 font-medium">Sales Order Grand Total: </span>
                    <strong className="text-sm font-bold text-emerald-700 ml-1 font-mono">
                      ₹{liveTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Customer PO & Terms */}
          {selectedQuotationDetails && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 md:p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <div className="p-1 rounded bg-blue-100 text-blue-600">
                  <ShoppingBag size={15} />
                </div>
                <span>Step 3: Customer Purchase Order & Terms</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField label="Customer PO Number" helpText="Buyer's purchase order reference">
                  <Input
                    placeholder="e.g. PO-2026-9901"
                    value={customerPoNumber}
                    onChange={(e) => setCustomerPoNumber(e.target.value)}
                  />
                </FormField>

                <FormField label="Customer PO Date">
                  <Input
                    type="date"
                    value={customerPoDate}
                    onChange={(e) => setCustomerPoDate(e.target.value)}
                  />
                </FormField>

                <FormField label="Expected Delivery Date">
                  <Input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Payment Terms">
                  <Input
                    placeholder="e.g. 50% advance, 50% against PI before dispatch"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                  />
                </FormField>

                <FormField label="Delivery Terms">
                  <Input
                    placeholder="e.g. Ex-Works / Door Delivery within 3 weeks"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="General Terms & Conditions" helpText="Quotation-derived commercial terms and conditions">
                <Textarea
                  rows={2}
                  placeholder="General terms and commercial conditions..."
                  value={generalTerms}
                  onChange={(e) => setGeneralTerms(e.target.value)}
                />
              </FormField>

              <FormField label="Sales Order Remarks / Instructions">
                <Textarea
                  rows={2}
                  placeholder="Additional order instructions or internal notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </FormField>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedQuotationId || submitting || loadingDetails || !lineItems || lineItems.length === 0}
            >
              {submitting ? 'Generating Sales Order...' : 'Confirm & Create Sales Order'}
            </Button>
          </div>

        </form>
      </Modal>

      {/* Quotation Changes Warning Confirmation Dialog */}
      <QuotationChangesModal
        isOpen={showChangesModal}
        changes={detectedChanges}
        quotationNo={selectedQuotationDetails?.header?.quotationNo || ''}
        onReview={() => setShowChangesModal(false)}
        onCancel={() => setShowChangesModal(false)}
        onConfirm={() => {
          const payload = buildSalesOrderPayload();
          if (!payload.items || payload.items.length === 0) {
            setError('Cannot create Sales Order without line items.');
            setShowChangesModal(false);
            return;
          }
          executeCreateSalesOrder(payload);
        }}
        submitting={submitting}
      />
    </>
  );
};

export default SalesOrderCreateModal;
