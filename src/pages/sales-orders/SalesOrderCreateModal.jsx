import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Textarea, FormField } from '../../components/ui/FormField';
import { getQuotations, getQuotationById } from '../../services/quotationService';
import { createSalesOrder } from '../../services/salesOrderService';
import { Search, Calculator, Calendar, FileText, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag, X, Check } from 'lucide-react';

const SalesOrderCreateModal = ({ isOpen, onClose, onSuccess }) => {
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [eligibleQuotations, setEligibleQuotations] = useState([]);
  const [quotationSearch, setQuotationSearch] = useState('');

  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form Fields
  const [customerPoNumber, setCustomerPoNumber] = useState('');
  const [customerPoDate, setCustomerPoDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [remarks, setRemarks] = useState('');

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

        // De-duplicate by _id and strictly exclude any quotation with existing salesOrder or won/converted status
        const uniqueMap = new Map();
        list.forEach(q => {
          if (!q || !q._id) return;
          if (q.salesOrder) return;
          const statusLower = (q.status || '').toLowerCase();
          if (['won', 'converted', 'lost', 'cancelled'].includes(statusLower)) return;
          uniqueMap.set(q._id, q);
        });

        setEligibleQuotations(Array.from(uniqueMap.values()));
      } catch (err) {
        console.error("Failed to load eligible quotations:", err);
        setError("Failed to load eligible quotations from server.");
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
      return;
    }

    setLoadingDetails(true);
    setError('');
    try {
      const res = await getQuotationById(qId);
      if (res.success && res.quotation) {
        const qDoc = res.quotation;
        setSelectedQuotationDetails({
          header: qDoc,
          items: res.items || []
        });

        // Pre-fill terms & dates from quotation
        if (qDoc.paymentTerms) setPaymentTerms(qDoc.paymentTerms);
        if (qDoc.deliveryTerms) setDeliveryTerms(qDoc.deliveryTerms);
        if (qDoc.remarks) setRemarks(qDoc.remarks);
        if (qDoc.validTill) {
          setExpectedDeliveryDate(new Date(qDoc.validTill).toISOString().split('T')[0]);
        }
      } else {
        setError("Could not load selected quotation details.");
      }
    } catch (err) {
      console.error("Failed to load quotation details:", err);
      setError(err.response?.data?.message || "Error fetching quotation details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredQuotations = eligibleQuotations.filter(q => {
    if (!quotationSearch.trim()) return true;
    const term = quotationSearch.toLowerCase();
    const qNo = q.quotationNo ? q.quotationNo.toLowerCase() : '';
    const partyName = q.client?.companyName ? q.client.companyName.toLowerCase() : '';
    const amt = q.grandTotal ? String(q.grandTotal) : '';
    return qNo.includes(term) || partyName.includes(term) || amt.includes(term);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQuotationId) {
      setError("Please select an eligible accepted or released quotation.");
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        quotation: selectedQuotationId,
        customerPoNumber: customerPoNumber.trim(),
        customerPoDate: customerPoDate || null,
        expectedDeliveryDate: expectedDeliveryDate || null,
        paymentTerms: paymentTerms.trim(),
        deliveryTerms: deliveryTerms.trim(),
        remarks: remarks.trim()
      };

      const res = await createSalesOrder(payload);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || "Failed to create Sales Order");
      }
    } catch (err) {
      console.error("Create Sales Order error:", err);
      setError(err.response?.data?.message || "Server error while creating Sales Order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Sales Order from Quotation"
      size="lg"
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
              <div className="max-h-[210px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
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

        {/* Step 2: Commercial Snapshot Preview Card */}
        {selectedQuotationDetails && (
          <div className="bg-white rounded-xl border border-blue-200 shadow-xs p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <div className="p-1 rounded bg-blue-100 text-blue-600">
                  <FileText size={15} />
                </div>
                <span>Step 2: Quotation Commercial Snapshot</span>
              </h4>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                {selectedQuotationDetails.header.status}
              </span>
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
                <div className="text-[11px] text-slate-500">Order Category</div>
                <div className="capitalize text-slate-800 mt-0.5">
                  {selectedQuotationDetails.header.quotationType} / {selectedQuotationDetails.header.quotationCategory}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500">Grand Total</div>
                <div className="font-bold text-xs text-emerald-700 mt-0.5">
                  ₹{(selectedQuotationDetails.header.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <div className="max-h-[160px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10.5px] font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Item / Description</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2">UOM</th>
                      <th className="px-3 py-2 text-right">Rate (₹)</th>
                      <th className="px-3 py-2 text-right">Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {selectedQuotationDetails.items.map((item, idx) => (
                      <tr key={item._id || idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium">
                          {item.description}
                          {item.item?.itemCode && (
                            <span className="font-mono text-[11px] text-slate-500 ml-1.5">
                              ({item.item.itemCode})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-bold">{item.quantity}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {typeof item.uom === 'object' ? item.uom?.uomCode || item.uom?.uomName || item.uom?.unitSymbol || item.uom?.unitName : 'Units'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          ₹{(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          ₹{(item.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50/80 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Subtotal: </span>
                <strong className="text-slate-800">₹{(selectedQuotationDetails.header.subtotal || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-slate-500">P&F: </span>
                <strong className="text-slate-800">₹{(selectedQuotationDetails.header.pfAmount || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-slate-500">Freight: </span>
                <strong className="text-slate-800">₹{(selectedQuotationDetails.header.freightAmount || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-slate-500">Discount: </span>
                <strong className="text-slate-800">₹{(selectedQuotationDetails.header.discountAmount || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-slate-500">Taxable: </span>
                <strong className="text-slate-800">₹{(selectedQuotationDetails.header.taxableAmount || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-slate-500">Tax ({selectedQuotationDetails.header.taxName || 'GST'} {selectedQuotationDetails.header.taxRate || 0}%): </span>
                <strong className="text-slate-800">₹{(selectedQuotationDetails.header.taxAmount || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-slate-600 font-medium">Grand Total: </span>
                <strong className="text-sm font-bold text-emerald-700 ml-1">
                  ₹{(selectedQuotationDetails.header.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customer PO & Delivery Terms */}
        {selectedQuotationDetails && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 md:p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <div className="p-1 rounded bg-blue-100 text-blue-600">
                <ShoppingBag size={15} />
              </div>
              <span>Step 3: Customer Purchase Order & Delivery Terms</span>
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
            disabled={!selectedQuotationId || submitting || loadingDetails}
          >
            {submitting ? 'Generating Sales Order...' : 'Confirm & Create Sales Order'}
          </Button>
        </div>

      </form>
    </Modal>
  );
};

export default SalesOrderCreateModal;

