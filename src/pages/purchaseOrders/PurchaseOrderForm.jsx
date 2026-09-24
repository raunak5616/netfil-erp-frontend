import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder
} from '../../services/purchaseOrderService';
import { getPurchaseRequisitions, getPurchaseRequisitionById } from '../../services/purchaseRequisitionService';
import { getPurchaseEnquiries, getPurchaseEnquiryById } from '../../services/purchaseEnquiryService';
import { getClients } from '../../services/clientService';
import { getDepartments } from '../../services/departmentService';
import { getItems } from '../../services/itemService';
import { getUOMs } from '../../services/uomService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Package,
  Building2,
  Calendar,
  FileText,
  UserCheck,
  DollarSign,
  Truck
} from 'lucide-react';

const PO_TYPE_OPTIONS = [
  { value: 'GENERAL_PO', label: 'General PO' },
  { value: 'ADMIN_STATIONERY', label: 'Admin / Stationery' },
  { value: 'CAPITAL', label: 'Capital' },
  { value: 'CONSUMABLE', label: 'Consumable' },
  { value: 'EDD', label: 'EDD' },
  { value: 'OTHERS', label: 'Others' },
  { value: 'PACKING', label: 'Packing' },
  { value: 'LABOUR_SUBCONTRACT', label: 'Labour Subcontract' },
  { value: 'INSERT_TOOLS', label: 'Insert Tools' },
  { value: 'RAW_MATERIAL', label: 'Raw Material' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'MAINTENANCE', label: 'Maintenance' }
];

const PurchaseOrderForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Master Data Dropdowns
  const [approvedPrs, setApprovedPrs] = useState([]);
  const [eligiblePes, setEligiblePes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [uomsList, setUomsList] = useState([]);

  // Form Header State
  const [poType, setPoType] = useState('GENERAL_PO');
  const [supplier, setSupplier] = useState('');
  const [purchaseRequisition, setPurchaseRequisition] = useState('');
  const [purchaseEnquiry, setPurchaseEnquiry] = useState('');
  const [department, setDepartment] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [freight, setFreight] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [poStatus, setPoStatus] = useState('DRAFT');

  // Form Line Items State
  const [lineItems, setLineItems] = useState([
    {
      item: '',
      itemCode: '',
      itemName: '',
      requestedQuantity: 1, // alias for UI input
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

  // Load Master Data
  const loadMasterData = async () => {
    try {
      const [prRes, peRes, supplierRes, deptRes, itemRes, uomRes] = await Promise.all([
        getPurchaseRequisitions({ status: 'APPROVED', limit: 100 }).catch(() => ({ success: false, purchaseRequisitions: [] })),
        getPurchaseEnquiries({ limit: 100 }).catch(() => ({ success: false, purchaseEnquiries: [] })),
        getClients({ partyType: 'SUPPLIER', status: 'active', limit: 100 }).catch(() => ({ success: false, clients: [], parties: [] })),
        getDepartments().catch(() => ({ success: false, departments: [] })),
        getItems().catch(() => ({ success: false, items: [] })),
        getUOMs().catch(() => ({ success: false, uoms: [] }))
      ]);

      if (prRes.success && Array.isArray(prRes.purchaseRequisitions)) {
        setApprovedPrs(prRes.purchaseRequisitions);
      }
      if (peRes.success && Array.isArray(peRes.purchaseEnquiries)) {
        setEligiblePes(peRes.purchaseEnquiries.filter((p) => !['DRAFT', 'CANCELLED'].includes(p.status)));
      }
      const rawSuppliers = supplierRes.clients || supplierRes.parties || [];
      if (Array.isArray(rawSuppliers)) {
        setSuppliers(rawSuppliers.filter((s) => s.status === 'active' && ['SUPPLIER', 'BOTH'].includes(s.partyType)));
      }
      if (deptRes.success && Array.isArray(deptRes.departments)) {
        setDepartments(deptRes.departments.filter((d) => d.status === 'active'));
      }
      if (itemRes.success && Array.isArray(itemRes.items)) {
        setItemsList(itemRes.items.filter((i) => i.status === 'active'));
      }
      if (uomRes.success && Array.isArray(uomRes.uoms)) {
        setUomsList(uomRes.uoms.filter((u) => u.status === 'active'));
      }
    } catch (err) {
      console.error('Failed to load PO master data:', err);
      setError('Failed to load required master data.');
    }
  };

  // Load Existing PO for Edit
  const loadExistingPO = async () => {
    if (!id) return;
    setInitialLoading(true);
    setError('');
    try {
      const res = await getPurchaseOrderById(id);
      if (res.success && res.purchaseOrder) {
        const po = res.purchaseOrder;
        setPoStatus(po.status);

        if (po.status !== 'DRAFT') {
          setError(`Purchase Order "${po.poNumber}" is in status '${po.status}' and cannot be edited. Only DRAFT orders can be updated.`);
        }

        setPoType(po.poType || 'GENERAL_PO');
        setSupplier(po.supplier?._id || po.supplier || '');
        setPurchaseRequisition(po.purchaseRequisition?._id || po.purchaseRequisition || '');
        setPurchaseEnquiry(po.purchaseEnquiry?._id || po.purchaseEnquiry || '');
        setDepartment(po.department?._id || po.department || '');
        setCurrency(po.currency || 'INR');
        setExchangeRate(po.exchangeRate || 1);
        setExpectedDeliveryDate(po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toISOString().split('T')[0] : '');
        setDeliveryLocation(po.deliveryLocation || '');
        setPaymentTerms(po.paymentTerms || '');
        setDeliveryTerms(po.deliveryTerms || '');
        setFreight(po.freight || 0);
        setOtherCharges(po.otherCharges || 0);
        setRemarks(po.remarks || '');

        if (Array.isArray(po.items) && po.items.length > 0) {
          setLineItems(
            po.items.map((i) => ({
              item: i.item?._id || i.item || '',
              itemCode: i.itemCodeSnapshot || i.item?.itemCode || '',
              itemName: i.itemNameSnapshot || i.item?.itemName || '',
              quantity: i.quantity || 1,
              requestedQuantity: i.quantity || 1,
              uom: i.uom?._id || i.uom || '',
              uomCode: i.uomCodeSnapshot || i.uom?.uomCode || '',
              unitRate: i.unitRate || 0,
              discount: i.discount || 0,
              taxRate: i.taxRate || 0,
              requiredDate: i.requiredDate ? new Date(i.requiredDate).toISOString().split('T')[0] : '',
              specification: i.specification || '',
              remarks: i.remarks || ''
            }))
          );
        }
      } else {
        setError('Purchase Order not found.');
      }
    } catch (err) {
      console.error('Failed to fetch Purchase Order:', err);
      setError(err.response?.data?.message || 'Error loading Purchase Order details');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadMasterData();
      if (isEditMode) {
        await loadExistingPO();
      }
    };
    init();
  }, [id]);

  // Handle PR Selection
  const handlePRChange = async (prId) => {
    setPurchaseRequisition(prId);
    if (!prId) return;

    try {
      let fullPR = approvedPrs.find((p) => p._id === prId);
      if (!fullPR || !fullPR.items || fullPR.items.length === 0) {
        const res = await getPurchaseRequisitionById(prId);
        if (res.success && res.purchaseRequisition) fullPR = res.purchaseRequisition;
      }

      if (fullPR) {
        const deptId = typeof fullPR.department === 'object' ? fullPR.department._id : fullPR.department;
        if (deptId) setDepartment(deptId);

        if (Array.isArray(fullPR.items) && fullPR.items.length > 0) {
          setLineItems(
            fullPR.items.map((i) => ({
              item: i.item?._id || i.item || '',
              itemCode: i.itemCode || i.item?.itemCode || '',
              itemName: i.itemName || i.item?.itemName || '',
              quantity: i.requestedQuantity || 1,
              requestedQuantity: i.requestedQuantity || 1,
              uom: i.uom?._id || i.uom || '',
              uomCode: i.uomCode || i.uom?.uomCode || '',
              unitRate: 0,
              discount: 0,
              taxRate: 0,
              requiredDate: i.requiredDate
                ? new Date(i.requiredDate).toISOString().split('T')[0]
                : (fullPR.requiredDate ? new Date(fullPR.requiredDate).toISOString().split('T')[0] : ''),
              specification: i.specification || '',
              remarks: i.remarks || ''
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load PR details:', err);
    }
  };

  // Handle PE Selection
  const handlePEChange = async (peId) => {
    setPurchaseEnquiry(peId);
    if (!peId) return;

    try {
      let fullPE = eligiblePes.find((p) => p._id === peId);
      if (!fullPE || !fullPE.items || fullPE.items.length === 0) {
        const res = await getPurchaseEnquiryById(peId);
        if (res.success && res.purchaseEnquiry) fullPE = res.purchaseEnquiry;
      }

      if (fullPE) {
        const supId = typeof fullPE.supplier === 'object' ? fullPE.supplier._id : fullPE.supplier;
        if (supId) setSupplier(supId);

        const deptId = typeof fullPE.department === 'object' ? fullPE.department._id : fullPE.department;
        if (deptId) setDepartment(deptId);

        if (fullPE.purchaseRequisition) {
          const prId = typeof fullPE.purchaseRequisition === 'object' ? fullPE.purchaseRequisition._id : fullPE.purchaseRequisition;
          setPurchaseRequisition(prId);
        }

        if (fullPE.paymentTerms) setPaymentTerms(fullPE.paymentTerms);
        if (fullPE.deliveryTerms) setDeliveryTerms(fullPE.deliveryTerms);

        if (Array.isArray(fullPE.items) && fullPE.items.length > 0) {
          setLineItems(
            fullPE.items.map((i) => ({
              item: i.item?._id || i.item || '',
              itemCode: i.itemCode || i.item?.itemCode || '',
              itemName: i.itemName || i.item?.itemName || '',
              quantity: i.requestedQuantity || 1,
              requestedQuantity: i.requestedQuantity || 1,
              uom: i.uom?._id || i.uom || '',
              uomCode: i.uomCode || i.uom?.uomCode || '',
              unitRate: 0,
              discount: 0,
              taxRate: 0,
              requiredDate: i.requiredDate ? new Date(i.requiredDate).toISOString().split('T')[0] : '',
              specification: i.specification || '',
              remarks: i.remarks || ''
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load PE details:', err);
    }
  };

  // Line Item change handlers
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

  const handleUomSelect = (index, uomId) => {
    const updated = [...lineItems];
    const targetUom = uomsList.find((u) => u._id === uomId);
    updated[index] = {
      ...updated[index],
      uom: uomId,
      uomCode: targetUom ? targetUom.uomCode : ''
    };
    setLineItems(updated);
  };

  const handleLineFieldChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    // Sync quantity & requestedQuantity
    if (field === 'quantity') updated[index].requestedQuantity = value;
    if (field === 'requestedQuantity') updated[index].quantity = value;
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
        requestedQuantity: 1,
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
      setError('A Purchase Order must contain at least one line item.');
      return;
    }
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Live financial preview calculation matching backend math exactly
  const computedTotals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalQuantity = 0;

    const itemsWithAmounts = lineItems.map((line) => {
      const qty = Number(line.quantity || line.requestedQuantity) || 0;
      const rate = Number(line.unitRate) || 0;
      const disc = Number(line.discount) || 0;
      const taxR = Number(line.taxRate) || 0;

      const lineSubtotal = qty * rate;
      const taxableAmount = Math.max(0, lineSubtotal - disc);
      const lineTax = Math.round((taxableAmount * (taxR / 100)) * 100) / 100;
      const lineAmount = Math.round((taxableAmount + lineTax) * 100) / 100;

      subtotal += lineSubtotal;
      totalDiscount += disc;
      totalTax += lineTax;
      totalQuantity += qty;

      return {
        ...line,
        lineAmount,
        lineTax
      };
    });

    const frt = Math.max(0, Number(freight) || 0);
    const oth = Math.max(0, Number(otherCharges) || 0);
    const grandTotal = Math.round((subtotal - totalDiscount + totalTax + frt + oth) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      freight: frt,
      otherCharges: oth,
      grandTotal,
      totalQuantity,
      itemsWithAmounts
    };
  }, [lineItems, freight, otherCharges]);

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend Validations
    if (!supplier) {
      setError('Supplier (Party) selection is required.');
      return;
    }
    if (!department) {
      setError('Department is required.');
      return;
    }
    if (!expectedDeliveryDate) {
      setError('Expected Delivery Date is required.');
      return;
    }
    if (!lineItems || lineItems.length === 0) {
      setError('At least one line item is required.');
      return;
    }

    // Check duplicate items
    const selectedItemIds = lineItems.map((li) => li.item).filter(Boolean);
    const uniqueItemIds = new Set(selectedItemIds);
    if (selectedItemIds.length !== uniqueItemIds.size) {
      setError('Duplicate items found in line items table. Each item must be unique.');
      return;
    }

    // Validate each line item
    for (let idx = 0; idx < lineItems.length; idx++) {
      const line = lineItems[idx];
      const lineNo = idx + 1;
      if (!line.item) {
        setError(`Line Item #${lineNo}: Please select a master item.`);
        return;
      }
      if (!line.uom) {
        setError(`Line Item #${lineNo}: Please select a Unit of Measure (UOM).`);
        return;
      }
      const qty = Number(line.quantity || line.requestedQuantity);
      if (Number.isNaN(qty) || qty <= 0) {
        setError(`Line Item #${lineNo}: Quantity must be greater than 0.`);
        return;
      }
      const rate = Number(line.unitRate);
      if (Number.isNaN(rate) || rate < 0) {
        setError(`Line Item #${lineNo}: Unit rate cannot be negative.`);
        return;
      }
      const disc = Number(line.discount) || 0;
      if (disc < 0) {
        setError(`Line Item #${lineNo}: Discount cannot be negative.`);
        return;
      }
      const taxR = Number(line.taxRate) || 0;
      if (taxR < 0) {
        setError(`Line Item #${lineNo}: Tax rate cannot be negative.`);
        return;
      }
    }

    const payload = {
      poType,
      supplier,
      purchaseRequisition: purchaseRequisition || null,
      purchaseEnquiry: purchaseEnquiry || null,
      department,
      currency,
      exchangeRate: Number(exchangeRate) || 1,
      expectedDeliveryDate,
      deliveryLocation,
      paymentTerms,
      deliveryTerms,
      freight: Number(freight) || 0,
      otherCharges: Number(otherCharges) || 0,
      remarks,
      items: lineItems.map((li) => ({
        item: li.item,
        quantity: Number(li.quantity || li.requestedQuantity),
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
      let res;
      if (isEditMode) {
        res = await updatePurchaseOrder(id, payload);
      } else {
        res = await createPurchaseOrder(payload);
      }

      if (res.success && res.purchaseOrder) {
        setSuccess(res.message || 'Purchase Order saved successfully.');
        setTimeout(() => {
          navigate(`/purchase-orders/${res.purchaseOrder._id}`);
        }, 800);
      } else {
        setError(res.message || 'Failed to save Purchase Order.');
      }
    } catch (err) {
      console.error('Save Purchase Order Error:', err);
      setError(err.response?.data?.message || 'Error saving Purchase Order. Please check form inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-xs font-semibold">Loading Purchase Order details...</span>
      </div>
    );
  }

  const isFormDisabled = isEditMode && poStatus !== 'DRAFT';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
        subtitle={isEditMode ? 'Update DRAFT purchase order headers, financial rates, and line items.' : 'Issue a commercial purchase order standalone or from an Approved PR / Eligible PE.'}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/purchase-orders')}
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Orders
          </Button>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* GENERAL INFORMATION CARD */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <UserCheck size={16} className="text-blue-600" />
            PO Header & Source References
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* PO Type */}
            <FormField label="PO Type" required>
              <Select
                value={poType}
                onChange={(e) => setPoType(e.target.value)}
                disabled={isFormDisabled}
                required
              >
                {PO_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Supplier Party Selection */}
            <FormField label="Supplier (Party)" required>
              <Select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                disabled={isFormDisabled}
                required
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((sup) => (
                  <option key={sup._id} value={sup._id}>
                    {sup.companyName} ({sup.partyCode})
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Purchase Requisition Selection */}
            <FormField label="Source Purchase Requisition (Approved)">
              <Select
                value={purchaseRequisition}
                onChange={(e) => handlePRChange(e.target.value)}
                disabled={isFormDisabled || isEditMode}
              >
                <option value="">-- Select Approved PR (Optional) --</option>
                {approvedPrs.map((pr) => (
                  <option key={pr._id} value={pr._id}>
                    {pr.prNumber} ({new Date(pr.prDate).toLocaleDateString('en-GB')})
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Purchase Enquiry Selection */}
            <FormField label="Source Purchase Enquiry">
              <Select
                value={purchaseEnquiry}
                onChange={(e) => handlePEChange(e.target.value)}
                disabled={isFormDisabled || isEditMode}
              >
                <option value="">-- Select Eligible PE (Optional) --</option>
                {eligiblePes.map((pe) => (
                  <option key={pe._id} value={pe._id}>
                    {pe.enquiryNumber} ({pe.supplierName || 'PE'})
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Department */}
            <FormField label="Department" required>
              <Select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={isFormDisabled}
                required
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.departmentName} ({dept.departmentCode})
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Expected Delivery Date */}
            <FormField label="Expected Delivery Date" required>
              <Input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                disabled={isFormDisabled}
                required
              />
            </FormField>

            {/* Currency */}
            <FormField label="Currency">
              <Input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={isFormDisabled}
                placeholder="INR"
              />
            </FormField>

            {/* Exchange Rate */}
            <FormField label="Exchange Rate">
              <Input
                type="number"
                step="any"
                min="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Delivery Location */}
            <FormField label="Delivery Location" className="lg:col-span-2">
              <Input
                type="text"
                placeholder="e.g. Main Plant Warehouse Gate 2"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Payment Terms */}
            <FormField label="Payment Terms">
              <Input
                type="text"
                placeholder="e.g. 30 Days Net from GRN"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Delivery Terms */}
            <FormField label="Delivery Terms (Incoterms)">
              <Input
                type="text"
                placeholder="e.g. FOR Destination / Freight Paid"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Header Remarks */}
            <FormField label="Order Remarks & Terms" className="lg:col-span-4">
              <Textarea
                placeholder="Special order terms, compliance instructions..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={isFormDisabled}
                rows={2}
              />
            </FormField>

          </div>
        </div>

        {/* LINE ITEMS TABLE CARD */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              Order Line Items ({lineItems.length})
            </h3>
            {!isFormDisabled && (
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus size={14} className="mr-1" /> Add Line Item
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider text-left">
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2 min-w-[180px]">Item <span className="text-red-500">*</span></th>
                  <th className="px-3 py-2 w-24">Item Code</th>
                  <th className="px-3 py-2 w-24">Qty <span className="text-red-500">*</span></th>
                  <th className="px-3 py-2 w-28">UOM <span className="text-red-500">*</span></th>
                  <th className="px-3 py-2 w-28">Rate <span className="text-red-500">*</span></th>
                  <th className="px-3 py-2 w-24">Discount</th>
                  <th className="px-3 py-2 w-24">Tax %</th>
                  <th className="px-3 py-2 w-28 text-right">Line Amt</th>
                  <th className="px-3 py-2 w-32">Req. Date</th>
                  <th className="px-3 py-2 min-w-[140px]">Specs</th>
                  {!isFormDisabled && <th className="px-3 py-2 w-12 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {computedTotals.itemsWithAmounts.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                    
                    {/* Item Select */}
                    <td className="px-3 py-2">
                      <Select
                        value={line.item}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        disabled={isFormDisabled}
                        required
                        className="text-xs"
                      >
                        <option value="">-- Select Item --</option>
                        {itemsList.map((itm) => (
                          <option key={itm._id} value={itm._id}>
                            {itm.itemName} ({itm.itemCode})
                          </option>
                        ))}
                      </Select>
                    </td>

                    {/* Item Code */}
                    <td className="px-3 py-2">
                      <Input
                        type="text"
                        value={line.itemCode}
                        readOnly
                        disabled
                        className="bg-slate-100 font-mono text-[11px] text-slate-700"
                        placeholder="Auto"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="any"
                        min="0.0001"
                        value={line.quantity || line.requestedQuantity}
                        onChange={(e) => handleLineFieldChange(idx, 'quantity', e.target.value)}
                        disabled={isFormDisabled}
                        required
                        className="text-right font-semibold text-slate-900"
                      />
                    </td>

                    {/* UOM Select */}
                    <td className="px-3 py-2">
                      <Select
                        value={line.uom}
                        onChange={(e) => handleUomSelect(idx, e.target.value)}
                        disabled={isFormDisabled}
                        required
                        className="text-xs"
                      >
                        <option value="">-- UOM --</option>
                        {uomsList.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.uomCode} ({u.uomName})
                          </option>
                        ))}
                      </Select>
                    </td>

                    {/* Unit Rate */}
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={line.unitRate}
                        onChange={(e) => handleLineFieldChange(idx, 'unitRate', e.target.value)}
                        disabled={isFormDisabled}
                        required
                        className="text-right font-semibold text-slate-900"
                      />
                    </td>

                    {/* Discount */}
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={line.discount}
                        onChange={(e) => handleLineFieldChange(idx, 'discount', e.target.value)}
                        disabled={isFormDisabled}
                        className="text-right"
                      />
                    </td>

                    {/* Tax Rate */}
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={line.taxRate}
                        onChange={(e) => handleLineFieldChange(idx, 'taxRate', e.target.value)}
                        disabled={isFormDisabled}
                        className="text-right"
                      />
                    </td>

                    {/* Line Amount (Computed Live Preview) */}
                    <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono">
                      {line.lineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Required Date */}
                    <td className="px-3 py-2">
                      <Input
                        type="date"
                        value={line.requiredDate}
                        onChange={(e) => handleLineFieldChange(idx, 'requiredDate', e.target.value)}
                        disabled={isFormDisabled}
                      />
                    </td>

                    {/* Specification */}
                    <td className="px-3 py-2">
                      <Input
                        type="text"
                        placeholder="Specs..."
                        value={line.specification}
                        onChange={(e) => handleLineFieldChange(idx, 'specification', e.target.value)}
                        disabled={isFormDisabled}
                      />
                    </td>

                    {/* Remove Action */}
                    {!isFormDisabled && (
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove Line Item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isFormDisabled && (
            <div className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={addLineItem} className="text-blue-600">
                <Plus size={14} className="mr-1" /> Add Another Line Item
              </Button>
            </div>
          )}
        </div>

        {/* FINANCIAL SUMMARY & OVERHEAD CHARGES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Truck size={16} className="text-blue-600" /> Additional Charges (Freight & Overhead)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <FormField label="Freight Charges">
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={freight}
                  onChange={(e) => setFreight(e.target.value)}
                  disabled={isFormDisabled}
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
                  disabled={isFormDisabled}
                  className="text-right"
                />
              </FormField>
            </div>
          </div>

          {/* FINANCIAL TOTALS PREVIEW CARD */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md space-y-3 font-mono">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" /> Order Financial Summary
            </h3>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹ {computedTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Total Discount:</span>
                <span>- ₹ {computedTotals.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sky-400">
                <span>Total Tax:</span>
                <span>+ ₹ {computedTotals.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Freight & Other Charges:</span>
                <span>+ ₹ {(computedTotals.freight + computedTotals.otherCharges).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between items-center text-sm font-bold text-white">
                <span>Grand Total:</span>
                <span className="text-emerald-400 text-base">₹ {computedTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTONS BAR */}
        <div className="flex items-center justify-end gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/purchase-orders')}
            disabled={loading}
          >
            Cancel
          </Button>

          {!isFormDisabled && (
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              <Save size={14} className="mr-1.5" />
              {loading ? 'Saving...' : isEditMode ? 'Update Purchase Order' : 'Save as Draft Order'}
            </Button>
          )}
        </div>

      </form>
    </div>
  );
};

export default PurchaseOrderForm;
