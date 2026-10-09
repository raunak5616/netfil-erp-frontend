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
  const [initialItemIds, setInitialItemIds] = useState([]);

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
    discountRate: 0,
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

    const reqItemsList = (Array.isArray(selectedReq.items) && selectedReq.items.length > 0)
      ? selectedReq.items
      : [selectedReq]; // Fallback to single top-level fields for legacy data

    const mappedLineItems = reqItemsList.map((reqItem, idx) => {
      const itemRef = reqItem.item || selectedReq.item;
      const itemObj = (typeof itemRef === 'object' ? itemRef : allItems.find((i) => i._id === itemRef)) || null;

      const itemId = itemObj?._id || (typeof itemRef === 'string' ? itemRef : null) || '';
      const itemCatId = reqItem.itemCategory?._id || reqItem.itemCategory || itemObj?.itemCategory?._id || itemObj?.itemCategory || selectedReq.itemCategory?._id || selectedReq.itemCategory || '';
      const uomRef = reqItem.uom || selectedReq.uom || itemObj?.salesUom || itemObj?.inventoryUom;
      const uomId = (typeof uomRef === 'object' ? uomRef?._id : uomRef) || allUoms[0]?._id || '';
      const hsnCode = reqItem.hsnCode || selectedReq.hsnCode || itemObj?.hsnCode || '';

      let description = reqItem.description || '';
      if (!description) {
        if (itemObj) {
          description = itemObj.itemName;
        } else if (selectedReq.type === 'service' && selectedReq.serviceDescription) {
          description = selectedReq.serviceDescription;
        } else if (reqItem.constructionType) {
          description = `Item #${idx + 1} - ${reqItem.constructionType} Filter`;
        } else {
          description = `Item #${idx + 1} - Custom Air Filter Requirement`;
        }
      }

      const qty = reqItem.quantity !== null && reqItem.quantity !== undefined ? Number(reqItem.quantity) : (selectedReq.quantity !== null && selectedReq.quantity !== undefined ? Number(selectedReq.quantity) : 1);
      const dims = reqItem.dimensions || selectedReq.dimensions || {};
      const specs = Array.isArray(reqItem.specifications) && reqItem.specifications.length > 0 ? reqItem.specifications : (Array.isArray(selectedReq.specifications) ? selectedReq.specifications : []);
      const flangeDesignId = reqItem.flangeDesign?._id || reqItem.flangeDesign || selectedReq.flangeDesign?._id || selectedReq.flangeDesign || null;
      const constructionTypeVal = reqItem.constructionType || selectedReq.constructionType || 'FLANGE';

      // Detailed Technical Snapshot in remarks
      let remarksText = reqItem.remarks || selectedReq.remarks || '';
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

      if (dims && (dims.length || dims.width || dims.outerDiameter)) {
        const dimStr = (dims.length || dims.width)
          ? `Dim: ${dims.length || '—'}×${dims.width || '—'}${dims.height ? `×${dims.height}` : ''} ${dims.unit || 'mm'}`
          : `OD: ${dims.outerDiameter || '—'} ID: ${dims.innerDiameter || '—'} H: ${dims.height || '—'} ${dims.unit || 'mm'}`;
        if (!remarksText.includes('Dim:') && !remarksText.includes('OD:')) {
          remarksText = remarksText ? `${remarksText} (${dimStr})` : dimStr;
        }
      }

      return {
        item: itemId,
        itemCategory: itemCatId,
        description: description,
        quantity: qty,
        uom: uomId,
        unitPrice: 0,
        hsnCode: hsnCode,
        constructionType: constructionTypeVal,
        flangeDesign: flangeDesignId,
        flangeDesignSnapshot: reqItem.flangeDesignSnapshot || selectedReq.flangeDesignSnapshot || null,
        dimensions: dims,
        specifications: specs,
        remarks: remarksText,
      };
    });

    setLineItems(mappedLineItems);
  };

  // Load Master Selectors on Mount
  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true);
      try {
        const isSystemCode = (code) => {
          if (!code) return false;
          const u = String(code).toUpperCase();
          return u.startsWith('ITEM-WO-') || u.startsWith('ITEM-INV-') || u.startsWith('ITEM-OBOM-');
        };

        const [rRes, iRes, uRes, eRes] = await Promise.all([
          getRequirements().catch(() => ({ success: false, requirements: [] })),
          getItems({ typeFilter: 'MASTER' }).catch(() => ({ success: false, items: [] })),
          getUOMs().catch(() => ({ success: false, uoms: [] })),
          getEmployees().catch(() => ({ success: false, employees: [] })),
        ]);

        const reqsList = (rRes.success && Array.isArray(rRes.requirements)) ? rRes.requirements : [];
        const itemsList = (iRes.success && Array.isArray(iRes.items)) ? iRes.items.filter((i) => !isSystemCode(i.itemCode)) : [];
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
            if (Array.isArray(detailRes.items) && detailRes.items.length > 0) {
              setInitialItemIds(detailRes.items.map((it) => it._id));
              const loadedLineItems = detailRes.items.map((it) => ({
                _id: it._id,
                item: it.item?._id || it.item || '',
                itemCategory: it.itemCategory?._id || it.itemCategory || '',
                description: it.description || '',
                quantity: it.quantity || 1,
                uom: it.uom?._id || it.uom || '',
                unitPrice: it.unitPrice || 0,
                hsnCode: it.hsnCode || '',
                constructionType: it.constructionType || 'FLANGE',
                flangeDesign: it.flangeDesign?._id || it.flangeDesign || null,
                flangeDesignSnapshot: it.flangeDesignSnapshot || null,
                dimensions: it.dimensions || {},
                specifications: it.specifications || [],
                faceVelocity: it.dimensions?.faceVelocity || '',
                remarks: it.remarks || '',
              }));
              setLineItems(loadedLineItems);

              const loadedSubtotal = loadedLineItems.reduce(
                (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
                0
              );
              const qDiscountAmount = q.discountAmount || 0;
              const calcRate =
                loadedSubtotal > 0 && qDiscountAmount > 0
                  ? Number(((qDiscountAmount / loadedSubtotal) * 100).toFixed(2))
                  : 0;

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
                discountRate: calcRate,
                taxName: q.taxName || 'GST',
                taxRate: q.taxRate || 0,
                paymentTerms: q.paymentTerms || '',
                deliveryTerms: q.deliveryTerms || '',
                generalTerms: q.generalTerms || '',
                remarks: q.remarks || '',
              });
            } else {
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
                discountRate: 0,
                taxName: q.taxName || 'GST',
                taxRate: q.taxRate || 0,
                paymentTerms: q.paymentTerms || '',
                deliveryTerms: q.deliveryTerms || '',
                generalTerms: q.generalTerms || '',
                remarks: q.remarks || '',
              });
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
        hsnCode: targetItem?.hsnCode ? targetItem.hsnCode : next[index].hsnCode,
      };
      return next;
    });
  };

  const sanitizeNumberInput = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.length > 1 && str.startsWith('0') && !str.startsWith('0.')) {
      const cleaned = str.replace(/^0+/, '');
      return cleaned === '' ? '0' : cleaned;
    }
    return str;
  };

  const calculateLineCFM = (line) => {
    const dims = line.dimensions || {};
    let w = Number(dims.width || dims.length) || 0;
    let h = Number(dims.height) || 0;
    const unit = dims.unit || 'mm';

    if (!w || !h) {
      const text = `${line.description || ''} ${line.remarks || ''}`;
      const m = text.match(/(\d+(?:\.\d+)?)\s*[*×x]\s*(\d+(?:\.\d+)?)/i);
      if (m) {
        w = w || Number(m[1]);
        h = h || Number(m[2]);
      }
    }

    const fpm = Number(line.faceVelocity || dims.faceVelocity) || 0;
    if (w <= 0 || h <= 0 || fpm <= 0) return 0;

    let hFt = h;
    let wFt = w;
    const u = String(unit).toLowerCase();
    if (u === 'mm') {
      hFt = h / 304.8;
      wFt = w / 304.8;
    } else if (u === 'inch' || u === 'in' || u === 'inches') {
      hFt = h / 12;
      wFt = w / 12;
    }

    return Math.round(hFt * wFt * fpm);
  };

  const handleFaceVelocityChange = (index, value) => {
    setLineItems((prev) => {
      const next = [...prev];
      const sanitizedFpm = sanitizeNumberInput(value);
      const updatedLine = {
        ...next[index],
        faceVelocity: sanitizedFpm,
        dimensions: {
          ...(next[index].dimensions || {}),
          faceVelocity: sanitizedFpm,
        },
      };
      const calculatedCfm = calculateLineCFM(updatedLine);
      updatedLine.dimensions.cfm = calculatedCfm;
      updatedLine.dimensions.capacity = calculatedCfm;
      next[index] = updatedLine;
      return next;
    });
  };

  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev];
      let cleanVal = value;
      if (field === 'unitPrice' || field === 'quantity') {
        cleanVal = sanitizeNumberInput(value);
      }
      const updatedLine = { ...next[index], [field]: cleanVal };
      const calculatedCfm = calculateLineCFM(updatedLine);
      if (calculatedCfm > 0) {
        updatedLine.dimensions = {
          ...(updatedLine.dimensions || {}),
          cfm: calculatedCfm,
          capacity: calculatedCfm,
        };
      }
      next[index] = updatedLine;
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

    const dRate = Number(formData.discountRate) || 0;
    const discountRate = Math.min(100, Math.max(0, dRate));
    const discountAmount = subtotal > 0 && discountRate > 0 ? (subtotal * discountRate) / 100 : 0;

    const pf = Number(formData.pfAmount) || 0;
    const freight = Number(formData.freightAmount) || 0;
    const tRate = Number(formData.taxRate) || 0;

    const taxableAmount = Math.max(0, subtotal - discountAmount + pf + freight);
    const taxAmount = tRate > 0 ? (taxableAmount * tRate) / 100 : 0;
    const grandTotal = Math.max(0, taxableAmount + taxAmount);

    return { subtotal, discountRate, discountAmount, taxableAmount, taxAmount, grandTotal };
  }, [lineItems, formData.pfAmount, formData.freightAmount, formData.discountRate, formData.taxRate]);

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
      const lineItemsPayload = lineItems.map((item) => ({
        _id: item._id || undefined,
        item: item.item || null,
        itemCategory: item.itemCategory || null,
        description: item.description,
        quantity: Number(item.quantity),
        uom: item.uom,
        unitPrice: Number(item.unitPrice),
        hsnCode: item.hsnCode,
        constructionType: item.constructionType || 'FLANGE',
        flangeDesign: item.flangeDesign || null,
        flangeDesignSnapshot: item.flangeDesignSnapshot || null,
        dimensions: item.dimensions || {},
        specifications: item.specifications || [],
        remarks: item.remarks || '',
      }));

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
        discountAmount: Number(totals.discountAmount) || 0,
        taxName: formData.taxName,
        taxRate: Number(formData.taxRate) || 0,
        paymentTerms: formData.paymentTerms,
        deliveryTerms: formData.deliveryTerms,
        generalTerms: formData.generalTerms,
        remarks: formData.remarks,
        items: lineItemsPayload,
      };

      let savedQuotationId;

      if (isEdit) {
        savedQuotationId = quotation._id;
        await updateQuotation(savedQuotationId, headerPayload);

        // Delete items that were removed in the UI form
        const currentFormIds = new Set(
          lineItemsPayload.filter((it) => it._id).map((it) => String(it._id))
        );
        for (const oldId of initialItemIds) {
          if (!currentFormIds.has(String(oldId))) {
            await deleteQuotationItem(savedQuotationId, oldId).catch((err) =>
              console.error('Failed to delete quotation item:', err)
            );
          }
        }

        // Update existing items or add new items
        for (const item of lineItemsPayload) {
          if (item._id) {
            await updateQuotationItem(savedQuotationId, item._id, item);
          } else {
            await addQuotationItem(savedQuotationId, item);
          }
        }
      } else {
        // Create Header and Line Items atomically
        const createRes = await createQuotation(headerPayload);
        if (!createRes.success || !createRes.quotation) {
          throw new Error(createRes.message || 'Failed to create quotation header');
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Package size={16} className="text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                  2. Quotation Line Items (Manual Rate Entry)
                </h4>
              </div>
              <Button type="button" variant="outline" size="xs" onClick={handleAddLineItem} className="text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                <Plus size={14} className="mr-1" /> Add Line Item
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {lineItems.map((line, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs hover:border-slate-300 transition-all space-y-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-center bg-slate-50 -mx-4 -mt-4 px-4 py-2.5 rounded-t-xl border-b border-slate-200/80 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Line #{idx + 1}
                      </span>
                      {line.item && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                          Catalog Item
                        </span>
                      )}
                    </div>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-0.5"
                      >
                        <Trash2 size={13} className="mr-1" /> Remove Line
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-start">
                    {/* Item Master Select */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-4">
                      <label className="form-label text-[11px] font-medium text-slate-700">Item Master</label>
                      <Select
                        value={line.item}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        className="w-full text-xs"
                      >
                        <option value="">Custom Item / Service</option>
                        {items.map((it) => (
                          <option key={it._id} value={it._id}>
                            {it.itemName} ({it.itemCode})
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Description */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-5">
                      <label className="form-label text-[11px] font-medium text-slate-700">Description *</label>
                      <Input
                        type="text"
                        placeholder="Item Description"
                        value={line.description}
                        onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                        className="w-full text-xs"
                        required
                      />
                    </div>

                    {/* HSN Code */}
                    <div className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3">
                      <label className="form-label text-[11px] font-medium text-slate-700">HSN Code</label>
                      <Input
                        type="text"
                        placeholder="HSN Code"
                        value={line.hsnCode}
                        onChange={(e) => handleLineItemChange(idx, 'hsnCode', e.target.value)}
                        className="w-full text-xs font-mono"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-6 sm:col-span-3 md:col-span-3 lg:col-span-2">
                      <label className="form-label text-[11px] font-medium text-slate-700">Quantity *</label>
                      <Input
                        type="number"
                        min="0.01"
                        step="any"
                        value={line.quantity}
                        onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                        className="w-full text-xs font-medium"
                        required
                      />
                    </div>

                    {/* UOM */}
                    <div className="col-span-6 sm:col-span-3 md:col-span-3 lg:col-span-2">
                      <label className="form-label text-[11px] font-medium text-slate-700">UOM *</label>
                      <Select
                        value={line.uom}
                        onChange={(e) => handleLineItemChange(idx, 'uom', e.target.value)}
                        className="w-full text-xs"
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

                    {/* Rate / Unit (₹) */}
                    <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/80">
                      <label className="form-label text-[11px] text-indigo-900 font-bold flex items-center justify-between">
                        <span>Rate / Unit (₹) *</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={line.unitPrice === 0 || line.unitPrice === '0' ? '' : line.unitPrice}
                        onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                        className="font-bold text-slate-900 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-200 text-sm bg-white"
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

                    {/* Item Remarks */}
                    <div className="col-span-12 lg:col-span-4">
                      <label className="form-label text-[11px] font-medium text-slate-700">Item Remarks / Specs</label>
                      <Input
                        type="text"
                        placeholder="Remarks, Grade, Dims, Specs..."
                        value={line.remarks}
                        onChange={(e) => handleLineItemChange(idx, 'remarks', e.target.value)}
                        className="w-full text-xs"
                      />
                    </div>

                    {/* Airflow / CFM Calculator Bar */}
                    <div className="col-span-12 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 grid grid-cols-12 gap-3 items-center mt-1">
                      <div className="col-span-12 sm:col-span-4 lg:col-span-4 flex items-center space-x-1.5 text-xs font-semibold text-slate-800">
                        <Calculator size={14} className="text-indigo-600 shrink-0" />
                        <span>Airflow CFM Calculator</span>
                      </div>
                      <div className="col-span-6 sm:col-span-4 lg:col-span-4">
                        <label className="form-label text-[10px] font-medium text-slate-600">Face Velocity (FPM) *</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="e.g. 500"
                          value={line.faceVelocity || line.dimensions?.faceVelocity || ''}
                          onChange={(e) => handleFaceVelocityChange(idx, e.target.value)}
                          className="w-full text-xs bg-white font-medium"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-4 lg:col-span-4">
                        <label className="form-label text-[10px] font-medium text-slate-600">Calculated Airflow (CFM)</label>
                        <div className="h-8 px-2.5 bg-indigo-50/80 border border-indigo-200 rounded-md flex items-center justify-between font-mono font-bold text-indigo-950 text-xs">
                          <span>{calculateLineCFM(line) || line.dimensions?.cfm || 0} CFM</span>
                          <span className="text-[10px] font-normal text-indigo-600">H(ft) × W(ft) × FPM</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Computed Line Total Footer */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between bg-emerald-50/60 -mx-4 -mb-4 px-4 py-2 rounded-b-xl">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Computed Line Total
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-emerald-700">Line Total:</span>
                      <span className="text-sm font-bold text-emerald-950 font-mono">
                        ₹{((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
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
                  placeholder="0.00"
                  value={formData.pfAmount === 0 || formData.pfAmount === '0' ? '' : formData.pfAmount}
                  onChange={(e) => setFormData({ ...formData, pfAmount: sanitizeNumberInput(e.target.value) })}
                />
              </div>

              <div>
                <label className="form-label">Freight Amount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={formData.freightAmount === 0 || formData.freightAmount === '0' ? '' : formData.freightAmount}
                  onChange={(e) => setFormData({ ...formData, freightAmount: sanitizeNumberInput(e.target.value) })}
                />
              </div>

              {/* Discount Input (%) */}
              <div>
                <label className="form-label text-[11px] font-medium text-slate-700">
                  Discount (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  placeholder="e.g. 5"
                  value={formData.discountRate === 0 || formData.discountRate === '0' ? '' : formData.discountRate}
                  onChange={(e) => {
                    const val = sanitizeNumberInput(e.target.value);
                    if (Number(val) > 100) return;
                    setFormData({ ...formData, discountRate: val });
                  }}
                />
                {Number(formData.discountRate) > 0 && (
                  <div className="text-[10px] text-indigo-600 mt-1 font-medium">
                    = ₹{totals.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} off
                  </div>
                )}
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
                  value={formData.taxRate === 0 || formData.taxRate === '0' ? '' : formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: sanitizeNumberInput(e.target.value) })}
                />
              </div>

              {/* Real-time calculated Commercial Summary Box */}
              <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 text-[10px] block font-medium">Subtotal:</span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-100">
                  <span className="text-amber-700 text-[10px] block font-medium">Discount:</span>
                  <div className="text-xs font-bold text-amber-900 mt-0.5">-₹{totals.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 text-[10px] block font-medium">Taxable:</span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-100">
                  <span className="text-sky-700 text-[10px] block font-medium">Tax Amount:</span>
                  <div className="text-xs font-bold text-sky-800 mt-0.5">₹{totals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 col-span-2 md:col-span-1">
                  <span className="text-emerald-700 text-[10px] block font-medium">Grand Total:</span>
                  <div className="text-xs font-bold text-emerald-950 mt-0.5">
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
