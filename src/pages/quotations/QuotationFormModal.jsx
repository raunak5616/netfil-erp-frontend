import React, { useState, useEffect, useMemo } from 'react';
import {
  createQuotation,
  updateQuotation,
  addQuotationItem,
  updateQuotationItem,
  deleteQuotationItem,
  getQuotationById,
} from '../../services/quotationService';
import { getClients } from '../../services/clientService';
import { getRequirements } from '../../services/requirementService';
import { getItems } from '../../services/itemService';
import { getUOMs } from '../../services/uomService';
import { getEmployees } from '../../services/employeeService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select, AsyncSelect } from '../../components/ui/FormField';
import { Plus, Trash2, Calculator, Layers, Package } from 'lucide-react';
import QuotationRateSuggestion from './QuotationRateSuggestion';

const QuotationFormModal = ({ isOpen, onClose, onSuccess, quotation = null, initialRequirement = null }) => {
  const isEdit = Boolean(quotation && quotation._id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Master Data Options
  const [clients, setClients] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [items, setItems] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);

  // Initial Requirement Resolution
  const initialReqObj = typeof initialRequirement === 'object' ? initialRequirement : null;
  const initialReqId = initialReqObj?._id || (typeof initialRequirement === 'string' ? initialRequirement : '');
  const initialClientId = initialReqObj?.client?._id || initialReqObj?.client || '';

  // Form Header Data
  const [formData, setFormData] = useState({
    client: initialClientId,
    requirement: initialReqId,
    quotationType: 'domestic',
    quotationCategory: 'product',
    attentionPerson: initialReqObj?.client?.contactPerson || '',
    salesPerson: initialReqObj?.salesPerson?._id || initialReqObj?.salesPerson || '',
    quotationDate: new Date().toISOString().split('T')[0],
    validTill: '',
    currency: 'INR',
    pfAmount: 0,
    freightAmount: 0,
    discountAmount: 0,
    taxName: 'GST',
    taxRate: 18,
    paymentTerms: '50% Advance, 50% Before Dispatch',
    deliveryTerms: '2-3 Weeks from PO & Advance',
    generalTerms: 'Freight extra at actuals.',
    remarks: '',
  });

  // Line Items List
  const [lineItems, setLineItems] = useState([
    {
      item: '',
      itemCategory: '',
      description: '',
      quantity: 1,
      uom: '',
      unitPrice: 0,
      hsnCode: '',
      remarks: '',
    },
  ]);

  // Robust Enquiry Line Item Auto-Population Handler
  const populateLineItemsFromRequirement = (selectedReq, allItems = items, allUoms = uoms) => {
    if (!selectedReq) return;

    const clientId = typeof selectedReq.client === 'object' ? selectedReq.client?._id : selectedReq.client;
    const salesPersonId = typeof selectedReq.salesPerson === 'object' ? selectedReq.salesPerson?._id : selectedReq.salesPerson;

    setFormData((prev) => ({
      ...prev,
      client: clientId || prev.client,
      requirement: selectedReq._id || prev.requirement,
      salesPerson: salesPersonId || prev.salesPerson,
      attentionPerson: (typeof selectedReq.client === 'object' ? selectedReq.client?.contactPerson : '') || prev.attentionPerson,
    }));

    // Resolve catalog item object (if requirement has catalog item reference)
    const itemObj = (typeof selectedReq.item === 'object' ? selectedReq.item : allItems.find((i) => i._id === selectedReq.item)) || null;

    const itemId = itemObj?._id || (typeof selectedReq.item === 'string' ? selectedReq.item : null) || '';
    const itemCatId = itemObj?.itemCategory?._id || itemObj?.itemCategory || selectedReq.itemCategory?._id || selectedReq.itemCategory || '';
    const uomId = selectedReq.uom?._id || selectedReq.uom || itemObj?.salesUom?._id || itemObj?.salesUom || itemObj?.inventoryUom?._id || itemObj?.inventoryUom || allUoms[0]?._id || '';
    const hsnCode = itemObj?.hsnCode || '';

    let description = '';
    if (itemObj) {
      description = itemObj.itemName;
    } else if (selectedReq.type === 'service' && selectedReq.serviceDescription) {
      description = selectedReq.serviceDescription;
    } else {
      description = 'Custom Air Filter Requirement';
    }

    const qty = selectedReq.quantity !== null && selectedReq.quantity !== undefined ? Number(selectedReq.quantity) : 1;
    const dims = selectedReq.dimensions || {};
    const specs = Array.isArray(selectedReq.specifications) ? selectedReq.specifications : [];

    // Detailed Technical Snapshot in remarks
    let remarksText = selectedReq.remarks || '';
    if (itemObj?.filterGrade) {
      const fg = typeof itemObj.filterGrade === 'object' ? itemObj.filterGrade : null;
      const fgName = fg ? fg.filterGrade : itemObj.filterGrade;
      const eurovent = fg?.eurovent || '';
      const iso = fg?.iso || '';
      const fgStr = [fgName ? `Grade: ${fgName}` : '', eurovent ? `EU: ${eurovent}` : '', iso ? `ISO: ${iso}` : ''].filter(Boolean).join(' / ');
      if (fgStr && !remarksText.includes('Grade:')) {
        remarksText = remarksText ? `${fgStr} | ${remarksText}` : fgStr;
      }
    }

    if (dims && (dims.length || dims.width)) {
      const dimStr = `Dim: ${dims.length || '—'}×${dims.width || '—'}${dims.height ? `×${dims.height}` : ''} ${dims.unit || 'mm'}`;
      if (!remarksText.includes('Dim:')) {
        remarksText = remarksText ? `${remarksText} (${dimStr})` : dimStr;
      }
    }

    setLineItems([
      {
        item: itemId,
        itemCategory: itemCatId,
        description: description,
        quantity: qty,
        uom: uomId,
        unitPrice: 0, // Rate strictly blank / 0 for manual entry
        hsnCode: hsnCode,
        dimensions: dims,
        specifications: specs,
        remarks: remarksText,
      },
    ]);
  };

  // Load Master Selectors on Mount
  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true);
      try {
        const [rRes, iRes, uRes, eRes] = await Promise.all([
          getRequirements().catch(() => ({ success: false, requirements: [] })),
          getItems().catch(() => ({ success: false, items: [] })),
          getUOMs().catch(() => ({ success: false, uoms: [] })),
          getEmployees().catch(() => ({ success: false, employees: [] })),
        ]);

        const reqsList = (rRes.success && Array.isArray(rRes.requirements)) ? rRes.requirements : [];
        const itemsList = (iRes.success && Array.isArray(iRes.items)) ? iRes.items : [];
        const uomsList = (uRes.success && Array.isArray(uRes.uoms)) ? uRes.uoms : [];
        const empList = (eRes.success && Array.isArray(eRes.employees)) ? eRes.employees : [];

        setRequirements(reqsList);
        setItems(itemsList);
        setUoms(uomsList);
        setSalesPersons(empList);

        // If Editing, load complete quotation detail with items
        if (isEdit) {
          const detailRes = await getQuotationById(quotation._id);
          if (detailRes.success && detailRes.quotation) {
            const q = detailRes.quotation;
            setFormData({
              client: q.client?._id || q.client || '',
              clientName: q.client?.companyName || '',
              clientCode: q.client?.clientCode || '',
              requirement: q.requirement?._id || q.requirement || '',
              quotationType: q.quotationType || 'domestic',
              quotationCategory: q.quotationCategory || 'product',
              attentionPerson: q.attentionPerson || '',
              salesPerson: q.salesPerson?._id || q.salesPerson || '',
              quotationDate: q.quotationDate ? new Date(q.quotationDate).toISOString().split('T')[0] : '',
              validTill: q.validTill ? new Date(q.validTill).toISOString().split('T')[0] : '',
              currency: q.currency || 'INR',
              pfAmount: q.pfAmount || 0,
              freightAmount: q.freightAmount || 0,
              discountAmount: q.discountAmount || 0,
              taxName: q.taxName || 'GST',
              taxRate: q.taxRate || 0,
              paymentTerms: q.paymentTerms || '',
              deliveryTerms: q.deliveryTerms || '',
              generalTerms: q.generalTerms || '',
              remarks: q.remarks || '',
            });

            if (Array.isArray(detailRes.items) && detailRes.items.length > 0) {
              setLineItems(
                detailRes.items.map((it) => ({
                  _id: it._id,
                  item: it.item?._id || it.item || '',
                  itemCategory: it.itemCategory?._id || it.itemCategory || '',
                  description: it.description || '',
                  quantity: it.quantity || 1,
                  uom: it.uom?._id || it.uom || '',
                  unitPrice: it.unitPrice || 0,
                  hsnCode: it.hsnCode || '',
                  remarks: it.remarks || '',
                }))
              );
            }
          }
        } else {
          // If creating a new quotation with a pre-selected requirement or initialRequirement
          const targetReqId = initialReqId || formData.requirement;
          const matchedReq = initialReqObj || reqsList.find((r) => r._id === targetReqId);
          if (matchedReq) {
            populateLineItemsFromRequirement(matchedReq, itemsList, uomsList);
          }
        }
      } catch (err) {
        console.error('Failed to load master options for Quotation form:', err);
        setError('Failed to load required master data');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadMasters();
    }
  }, [isOpen, isEdit, quotation?._id]);

  // Client Selection Async Handler
  const loadClientOptions = async (inputValue) => {
    try {
      const res = await getClients({ search: inputValue, limit: 15, status: 'active' });
      if (res.success && Array.isArray(res.clients)) {
        return res.clients.map((c) => ({
          value: c._id,
          label: c.companyName,
          secondaryLabel: c.clientCode,
          contactPerson: c.contactPerson,
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const handleClientChange = (e, selectedOption) => {
    const clientId = e?.target?.value || '';
    setFormData((prev) => ({
      ...prev,
      client: clientId,
      requirement: '',
      attentionPerson: selectedOption?.contactPerson || prev.attentionPerson,
    }));
  };

  // Filter available requirements for selected client
  const availableRequirements = useMemo(() => {
    if (!formData.client) return [];
    return requirements.filter((r) => {
      const clientId = typeof r.client === 'object' ? r.client?._id : r.client;
      return clientId === formData.client;
    });
  }, [requirements, formData.client]);

  // Handle Requirement Selection from dropdown
  const handleRequirementChange = (reqId) => {
    const selectedReq = requirements.find((r) => r._id === reqId);
    if (selectedReq) {
      populateLineItemsFromRequirement(selectedReq);
    } else {
      setFormData((prev) => ({ ...prev, requirement: reqId }));
    }
  };

  // Line Item Handlers
  const handleItemSelect = (index, itemId) => {
    const targetItem = items.find((i) => i._id === itemId);
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        item: itemId,
        itemCategory: targetItem ? targetItem.itemCategory?._id || targetItem.itemCategory : '',
        description: targetItem ? targetItem.itemName : next[index].description,
        uom: targetItem ? targetItem.inventoryUom?._id || targetItem.inventoryUom : next[index].uom,
        hsnCode: targetItem ? targetItem.hsnCode : next[index].hsnCode,
      };
      return next;
    });
  };

  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        item: '',
        itemCategory: '',
        description: '',
        quantity: 1,
        uom: uoms[0]?._id || '',
        unitPrice: 0,
        hsnCode: '',
        remarks: '',
      },
    ]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length === 1) {
      alert('Quotation must contain at least 1 line item.');
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic Commercial Totals Calculation
  const totals = React.useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.unitPrice) || 0;
      return sum + q * p;
    }, 0);

    const pf = Number(formData.pfAmount) || 0;
    const freight = Number(formData.freightAmount) || 0;
    const discount = Number(formData.discountAmount) || 0;
    const tRate = Number(formData.taxRate) || 0;

    const taxableAmount = Math.max(0, subtotal - discount + pf + freight);
    const taxAmount = tRate > 0 ? (taxableAmount * tRate) / 100 : 0;
    const grandTotal = Math.max(0, taxableAmount + taxAmount);

    return { subtotal, taxableAmount, taxAmount, grandTotal };
  }, [lineItems, formData.pfAmount, formData.freightAmount, formData.discountAmount, formData.taxRate]);

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!formData.client) {
      setError('Please select a Party / Client');
      return;
    }
    if (!formData.requirement) {
      setError('Please select a Requirement reference');
      return;
    }

    if (lineItems.length === 0) {
      setError('At least 1 line item is required');
      return;
    }

    for (let i = 0; i < lineItems.length; i++) {
      const it = lineItems[i];
      if (!it.uom) {
        setError(`Line item #${i + 1}: UOM is required`);
        return;
      }
      if (!it.description.trim()) {
        setError(`Line item #${i + 1}: Description is required`);
        return;
      }
      if (Number(it.quantity) <= 0) {
        setError(`Line item #${i + 1}: Quantity must be greater than 0`);
        return;
      }
      if (Number(it.unitPrice) < 0) {
        setError(`Line item #${i + 1}: Unit price cannot be negative`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const headerPayload = {
        client: formData.client,
        requirement: formData.requirement,
        quotationType: formData.quotationType,
        quotationCategory: formData.quotationCategory,
        attentionPerson: formData.attentionPerson,
        salesPerson: formData.salesPerson || null,
        quotationDate: formData.quotationDate,
        validTill: formData.validTill || null,
        currency: formData.currency,
        pfAmount: Number(formData.pfAmount) || 0,
        freightAmount: Number(formData.freightAmount) || 0,
        discountAmount: Number(formData.discountAmount) || 0,
        taxName: formData.taxName,
        taxRate: Number(formData.taxRate) || 0,
        paymentTerms: formData.paymentTerms,
        deliveryTerms: formData.deliveryTerms,
        generalTerms: formData.generalTerms,
        remarks: formData.remarks,
      };

      let savedQuotationId;

      if (isEdit) {
        savedQuotationId = quotation._id;
        await updateQuotation(savedQuotationId, headerPayload);

        // Update items: delete existing items not in form, update existing, add new
        // For simplicity, save items cleanly
        for (const item of lineItems) {
          const itemPayload = {
            item: item.item || null,
            itemCategory: item.itemCategory || null,
            description: item.description,
            quantity: Number(item.quantity),
            uom: item.uom,
            unitPrice: Number(item.unitPrice),
            hsnCode: item.hsnCode,
            remarks: item.remarks,
          };

          if (item._id) {
            await updateQuotationItem(savedQuotationId, item._id, itemPayload);
          } else {
            await addQuotationItem(savedQuotationId, itemPayload);
          }
        }
      } else {
        // Create Header
        const createRes = await createQuotation(headerPayload);
        if (!createRes.success || !createRes.quotation) {
          throw new Error(createRes.message || 'Failed to create quotation header');
        }
        savedQuotationId = createRes.quotation._id;

        // Add Line Items
        for (const item of lineItems) {
          const itemPayload = {
            item: item.item || null,
            itemCategory: item.itemCategory || null,
            description: item.description,
            quantity: Number(item.quantity),
            uom: item.uom,
            unitPrice: Number(item.unitPrice),
            hsnCode: item.hsnCode,
            remarks: item.remarks,
          };
          await addQuotationItem(savedQuotationId, itemPayload);
        }
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save Quotation:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save quotation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Quotation (${quotation?.quotationNo})` : 'Create New Quotation'}
      maxWidth="900px"
    >
      {loading ? (
        <div className="text-center p-10">Loading quotation form data...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          {/* Section 1: Header Information */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Commercial & Party Header Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Party / Customer *</label>
                <AsyncSelect
                  value={formData.client}
                  onChange={handleClientChange}
                  loadOptions={loadClientOptions}
                  initialLabel={formData.clientName}
                  initialSecondaryLabel={formData.clientCode}
                  placeholder="Search and select party..."
                  required
                />
              </div>

              <div>
                <label className="form-label">Requirement Reference *</label>
                <Select
                  value={formData.requirement}
                  onChange={(e) => handleRequirementChange(e.target.value)}
                  disabled={!formData.client}
                  required
                >
                  <option value="">
                    {formData.client ? 'Select Requirement' : 'Select Party First'}
                  </option>
                  {availableRequirements.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.requirementNo} ({r.type === 'product' ? 'Product' : 'Service'})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="form-label">Quotation Type</label>
                <Select
                  value={formData.quotationType}
                  onChange={(e) => setFormData({ ...formData, quotationType: e.target.value })}
                >
                  <option value="domestic">Domestic</option>
                  <option value="export">Export</option>
                </Select>
              </div>

              <div>
                <label className="form-label">Quotation Category</label>
                <Select
                  value={formData.quotationCategory}
                  onChange={(e) => setFormData({ ...formData, quotationCategory: e.target.value })}
                >
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                  <option value="spare">Spare</option>
                </Select>
              </div>

              <div>
                <label className="form-label">Attention Person</label>
                <Input
                  type="text"
                  placeholder="Contact Person Name"
                  value={formData.attentionPerson}
                  onChange={(e) => setFormData({ ...formData, attentionPerson: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Sales Person</label>
                <Select
                  value={formData.salesPerson}
                  onChange={(e) => setFormData({ ...formData, salesPerson: e.target.value })}
                >
                  <option value="">Select Sales Person</option>
                  {salesPersons.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="form-label">Quotation Date</label>
                <Input
                  type="date"
                  value={formData.quotationDate}
                  onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Valid Till Date</label>
                <Input
                  type="date"
                  value={formData.validTill}
                  onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Quotation Line Items (Manual Unit Rate Entry) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                2. Quotation Line Items (Manual Rate Entry)
              </h4>
              <Button type="button" variant="outline" size="xs" onClick={handleAddLineItem}>
                <Plus size={14} className="mr-1" /> Add Line Item
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {lineItems.map((line, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <strong className="text-xs text-slate-600">
                      Line #{idx + 1}
                    </strong>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} className="mr-1" /> Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-1">
                      <label className="form-label text-[11px]">Item Master</label>
                      <Select
                        value={line.item}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                      >
                        <option value="">Custom Item / Service</option>
                        {items.map((it) => (
                          <option key={it._id} value={it._id}>
                            {it.itemName} ({it.itemCode})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '11px' }}>Description *</label>
                      <Input
                        type="text"
                        placeholder="Item Description"
                        value={line.description}
                        onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '11px' }}>Quantity *</label>
                      <Input
                        type="number"
                        min="0.01"
                        step="any"
                        value={line.quantity}
                        onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '11px' }}>UOM *</label>
                      <Select
                        value={line.uom}
                        onChange={(e) => handleLineItemChange(idx, 'uom', e.target.value)}
                        required
                      >
                        <option value="">Select UOM</option>
                        {uoms.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.uomCode}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="form-label text-[11px] text-blue-700 font-bold">
                        Rate / Unit (₹) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Manual Rate"
                        value={line.unitPrice}
                        onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                        className="font-bold border-blue-400"
                        required
                      />
                      {formData.client && line.item && (
                        <QuotationRateSuggestion
                          customerId={formData.client}
                          itemId={line.item}
                          onSelectRate={(rate) => handleLineItemChange(idx, 'unitPrice', rate)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mt-2">
                    <div>
                      <label className="form-label text-[11px]">HSN Code</label>
                      <Input
                        type="text"
                        placeholder="HSN Code"
                        value={line.hsnCode}
                        onChange={(e) => handleLineItemChange(idx, 'hsnCode', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="form-label text-[11px]">Item Remarks</label>
                      <Input
                        type="text"
                        placeholder="Remarks / Specs"
                        value={line.remarks}
                        onChange={(e) => handleLineItemChange(idx, 'remarks', e.target.value)}
                      />
                    </div>

                    <div className="text-right flex items-center justify-end pb-2">
                      <span className="text-[11px] text-slate-500 mr-2">Line Total: </span>
                      <strong className="text-sm text-slate-900">
                        ₹{((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Commercial Adjustments & Tax Calculations */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              3. Commercial Charges & Dynamic Tax Calculations
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="form-label">P&F Amount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.pfAmount}
                  onChange={(e) => setFormData({ ...formData, pfAmount: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Freight Amount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.freightAmount}
                  onChange={(e) => setFormData({ ...formData, freightAmount: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Discount Amount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Tax Name</label>
                <Input
                  type="text"
                  placeholder="e.g. GST, IGST"
                  value={formData.taxName}
                  onChange={(e) => setFormData({ ...formData, taxName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mt-2">
              <div className="lg:col-span-1">
                <label className="form-label">Tax Rate (%)</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 18"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                />
              </div>

              {/* Real-time calculated Commercial Summary Box - simple design applied */}
              <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 text-[11px] block">Subtotal:</span>
                  <div className="text-sm font-bold text-slate-800">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 text-[11px] block">Taxable:</span>
                  <div className="text-sm font-bold text-slate-800">₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
                  <span className="text-sky-700 text-[11px] block">Tax Amount:</span>
                  <div className="text-sm font-bold text-sky-800">₹{totals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-emerald-700 text-[11px] block">Grand Total:</span>
                  <div className="text-base font-bold text-emerald-800">
                    ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Terms & Notes */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              4. Terms & Remarks
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Payment Terms</label>
                <Input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Delivery Terms</label>
                <Input
                  type="text"
                  value={formData.deliveryTerms}
                  onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">General Terms</label>
                <Input
                  type="text"
                  value={formData.generalTerms}
                  onChange={(e) => setFormData({ ...formData, generalTerms: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Remarks</label>
                <Input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Quotation' : 'Create Quotation'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default QuotationFormModal;
