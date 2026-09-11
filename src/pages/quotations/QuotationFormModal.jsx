import React, { useState, useEffect } from 'react';
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
import { Input, Select } from '../../components/ui/FormField';
import { Plus, Trash2, Calculator, Layers, Package } from 'lucide-react';

const QuotationFormModal = ({ isOpen, onClose, onSuccess, quotation = null }) => {
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

  // Form Header Data
  const [formData, setFormData] = useState({
    client: '',
    requirement: '',
    quotationType: 'domestic',
    quotationCategory: 'product',
    attentionPerson: '',
    salesPerson: '',
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
  // Each item object: { _id, item, itemCategory, description, quantity, uom, unitPrice, hsnCode, remarks }
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

  // Load Master Selectors on Mount
  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true);
      try {
        const [cRes, rRes, iRes, uRes, eRes] = await Promise.all([
          getClients().catch(() => ({ success: false, clients: [] })),
          getRequirements().catch(() => ({ success: false, requirements: [] })),
          getItems().catch(() => ({ success: false, items: [] })),
          getUOMs().catch(() => ({ success: false, uoms: [] })),
          getEmployees().catch(() => ({ success: false, employees: [] })),
        ]);

        if (cRes.success && Array.isArray(cRes.clients)) setClients(cRes.clients);
        if (rRes.success && Array.isArray(rRes.requirements)) setRequirements(rRes.requirements);
        if (iRes.success && Array.isArray(iRes.items)) setItems(iRes.items);
        if (uRes.success && Array.isArray(uRes.uoms)) setUoms(uRes.uoms);
        if (eRes.success && Array.isArray(eRes.employees)) setSalesPersons(eRes.employees);

        // If Editing, load complete quotation detail with items
        if (isEdit) {
          const detailRes = await getQuotationById(quotation._id);
          if (detailRes.success && detailRes.quotation) {
            const q = detailRes.quotation;
            setFormData({
              client: q.client?._id || q.client || '',
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

  // Filtered Requirements based on selected Client
  const availableRequirements = React.useMemo(() => {
    if (!formData.client) return [];
    return requirements.filter((r) => {
      const clientId = typeof r.client === 'object' ? r.client?._id : r.client;
      return clientId === formData.client;
    });
  }, [requirements, formData.client]);

  // Handle Client Selection
  const handleClientChange = (clientId) => {
    const selectedC = clients.find((c) => c._id === clientId);
    setFormData((prev) => ({
      ...prev,
      client: clientId,
      requirement: '',
      attentionPerson: selectedC?.contactPerson || prev.attentionPerson,
    }));
  };

  // Handle Requirement Selection -> Optionally populate defaults from Requirement
  const handleRequirementChange = (reqId) => {
    const selectedReq = requirements.find((r) => r._id === reqId);
    setFormData((prev) => ({
      ...prev,
      requirement: reqId,
      salesPerson: selectedReq?.salesPerson?._id || selectedReq?.salesPerson || prev.salesPerson,
    }));

    // If requirement has item, populate initial line item default
    if (selectedReq && selectedReq.item) {
      const targetItem = items.find((i) => i._id === (selectedReq.item._id || selectedReq.item));
      if (targetItem) {
        setLineItems([
          {
            item: targetItem._id,
            itemCategory: targetItem.itemCategory?._id || targetItem.itemCategory || '',
            description: targetItem.itemName,
            quantity: selectedReq.quantity || 1,
            uom: selectedReq.uom?._id || selectedReq.uom || targetItem.inventoryUom || '',
            unitPrice: 0, // CRITICAL: Manual rate entry required, 0 default
            hsnCode: targetItem.hsnCode || '',
            remarks: selectedReq.remarks || '',
          },
        ]);
      }
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
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading quotation form data...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          {/* Section 1: Header Information */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-700)', marginBottom: '12px', borderBottom: '1px solid var(--gray-200)', paddingBottom: '6px' }}>
              1. Commercial & Party Header Information
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Party / Customer *</label>
                <Select
                  value={formData.client}
                  onChange={(e) => handleClientChange(e.target.value)}
                  required
                >
                  <option value="">Select Party / Customer</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.clientCode})
                    </option>
                  ))}
                </Select>
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
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--gray-200)', paddingBottom: '6px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-700)', margin: 0 }}>
                2. Quotation Line Items (Manual Rate Entry)
              </h4>
              <Button type="button" variant="outline" size="xs" onClick={handleAddLineItem}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Add Line Item
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lineItems.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '6px',
                    background: 'var(--gray-50)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '12px', color: 'var(--gray-700)' }}>
                      Line #{idx + 1}
                    </strong>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRemoveLineItem(idx)}
                        style={{ color: 'var(--danger-600)' }}
                      >
                        <Trash2 size={14} /> Remove
                      </Button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr', gap: '8px', alignItems: 'center' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '11px' }}>Item Master</label>
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
                      <label className="form-label" style={{ fontSize: '11px', color: 'var(--primary-700)', fontWeight: 600 }}>
                        Rate / Unit (₹) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Manual Rate"
                        value={line.unitPrice}
                        onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                        style={{ fontWeight: 600, borderColor: 'var(--primary-400)' }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '11px' }}>HSN Code</label>
                      <Input
                        type="text"
                        placeholder="HSN Code"
                        value={line.hsnCode}
                        onChange={(e) => handleLineItemChange(idx, 'hsnCode', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '11px' }}>Item Remarks</label>
                      <Input
                        type="text"
                        placeholder="Remarks / Specs"
                        value={line.remarks}
                        onChange={(e) => handleLineItemChange(idx, 'remarks', e.target.value)}
                      />
                    </div>

                    <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--gray-600)' }}>Line Total: </span>
                      <strong style={{ fontSize: '13px', color: 'var(--gray-900)' }}>
                        ₹{((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Commercial Adjustments & Tax Calculations */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-700)', marginBottom: '12px', borderBottom: '1px solid var(--gray-200)', paddingBottom: '6px' }}>
              3. Commercial Charges & Dynamic Tax Calculations
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', alignItems: 'center' }}>
              <div>
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

              {/* Real-time calculated Commercial Summary Box */}
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--primary-50)',
                  border: '1px solid var(--primary-200)',
                  borderRadius: '6px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--gray-600)' }}>Subtotal:</span>
                  <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>₹{totals.subtotal.toFixed(2)}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-600)' }}>Taxable:</span>
                  <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>₹{totals.taxableAmount.toFixed(2)}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-600)' }}>Tax Amount:</span>
                  <div style={{ fontWeight: 600, color: 'var(--primary-700)' }}>₹{totals.taxAmount.toFixed(2)}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-600)' }}>Grand Total:</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-900)' }}>
                    ₹{totals.grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Terms & Notes */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-700)', marginBottom: '12px', borderBottom: '1px solid var(--gray-200)', paddingBottom: '6px' }}>
              4. Terms & Remarks
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--gray-200)', paddingTop: '12px' }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
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
