import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useGetPurchaseRequisitionsQuery,
  useLazyGetPurchaseRequisitionByIdQuery,
  useGetPurchaseEnquiriesQuery,
  useLazyGetPurchaseEnquiryByIdQuery,
} from '../../features/purchase/purchaseApi';
import { useGetClientsQuery, useGetUOMsQuery } from '../../features/masterData/masterDataApi';
import { useGetSuppliersQuery } from '../../features/suppliers/suppliersApi';
import { useGetDepartmentsQuery } from '../../features/departments/departmentsApi';
import { useGetItemsQuery } from '../../features/products/productsApi';
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
  IndianRupee,
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Master Data Dropdowns via RTK Query
  const { data: prRes } = useGetPurchaseRequisitionsQuery({ status: 'APPROVED', limit: 100 });
  const [getPRById] = useLazyGetPurchaseRequisitionByIdQuery();
  const { data: peRes } = useGetPurchaseEnquiriesQuery({ limit: 100 });
  const [getPEById] = useLazyGetPurchaseEnquiryByIdQuery();
  const { data: supplierRes } = useGetSuppliersQuery({ limit: 200, status: 'active', approvalStatus: 'APPROVED' });
  const { data: clientRes } = useGetClientsQuery({ partyType: 'SUPPLIER', status: 'active', limit: 200 });
  const { data: deptRes } = useGetDepartmentsQuery();
  const { data: itemRes } = useGetItemsQuery({ limit: 1000 });
  const { data: uomRes } = useGetUOMsQuery();

  const approvedPrs = useMemo(() => {
    return prRes?.purchaseRequisitions || prRes?.requisitions || [];
  }, [prRes]);

  const eligiblePes = useMemo(() => {
    const raw = peRes?.purchaseEnquiries || peRes?.enquiries || [];
    return Array.isArray(raw) ? raw.filter((p) => !['DRAFT', 'CANCELLED'].includes(p.status)) : [];
  }, [peRes]);

  const suppliers = useMemo(() => {
    const supplierList = supplierRes?.suppliers || supplierRes?.data?.suppliers || [];
    const partyList = clientRes?.clients || clientRes?.parties || [];

    const list = [
      ...supplierList.map((s) => ({
        _id: s._id,
        supplierName: s.supplierName || s.legalName,
        supplierCode: s.supplierCode,
        status: s.status,
      })),
      ...partyList
        .filter((p) => p.status === 'active' && ['SUPPLIER', 'BOTH'].includes(p.partyType))
        .map((p) => ({
          _id: p._id,
          supplierName: p.companyName,
          supplierCode: p.partyCode,
          status: p.status,
        })),
    ];

    const seen = new Set();
    return list.filter((item) => {
      if (!item._id || seen.has(item._id.toString())) return false;
      seen.add(item._id.toString());
      return true;
    });
  }, [supplierRes, clientRes]);

  const departments = useMemo(() => {
    const raw = deptRes?.departments || [];
    return Array.isArray(raw) ? raw.filter((d) => d.status === 'active') : [];
  }, [deptRes]);

  const itemsList = useMemo(() => {
    const raw = itemRes?.items || [];
    return Array.isArray(raw) ? raw.filter((i) => i.status === 'active') : [];
  }, [itemRes]);

  const uomsList = useMemo(() => {
    const raw = uomRes?.uoms || [];
    return Array.isArray(raw) ? raw.filter((u) => u.status === 'active') : [];
  }, [uomRes]);

  // Existing PO via RTK Query
  const {
    data: existingPoRes,
    isLoading: initialLoading,
    error: loadError,
  } = useGetPurchaseOrderByIdQuery(id, { skip: !isEditMode });

  const [createPurchaseOrderMutation, { isLoading: isCreating }] = useCreatePurchaseOrderMutation();
  const [updatePurchaseOrderMutation, { isLoading: isUpdating }] = useUpdatePurchaseOrderMutation();
  const loading = submitting || isCreating || isUpdating;

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

  // Populate Existing PO when loaded
  useEffect(() => {
    if (existingPoRes?.purchaseOrder) {
      const po = existingPoRes.purchaseOrder;
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
    }
  }, [existingPoRes]);

  // Handle PR Selection
  const handlePRChange = async (prId) => {
    setPurchaseRequisition(prId);
    if (!prId) return;

    try {
      let fullPR = approvedPrs.find((p) => p._id === prId);
      if (!fullPR || !fullPR.items || fullPR.items.length === 0) {
        const res = await getPRById(prId).unwrap();
        if (res?.purchaseRequisition) fullPR = res.purchaseRequisition;
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
        const res = await getPEById(peId).unwrap();
        if (res?.purchaseEnquiry) fullPE = res.purchaseEnquiry;
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

    setSubmitting(true);
    try {
      let res;
      if (isEditMode) {
        res = await updatePurchaseOrderMutation({ id, ...payload }).unwrap();
      } else {
        res = await createPurchaseOrderMutation(payload).unwrap();
      }

      const savedPO = res?.purchaseOrder || res;
      setSuccess(res?.message || 'Purchase Order saved successfully.');
      setTimeout(() => {
        navigate(`/purchase-orders/${savedPO._id || id}`);
      }, 800);
    } catch (err) {
      console.error('Save Purchase Order Error:', err);
      setError(err?.data?.message || err.message || 'Error saving Purchase Order. Please check form inputs.');
    } finally {
      setSubmitting(false);
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
            <FormField label="Supplier" required>
              <Select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                disabled={isFormDisabled}
                required
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((sup) => (
                  <option key={sup._id} value={sup._id}>
                    {sup.supplierName || sup.companyName} ({sup.supplierCode || sup.partyCode})
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Package size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Order Line Items</h3>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {lineItems.length} {lineItems.length === 1 ? 'line item' : 'line items'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Total Quantity: <strong className="text-slate-700">{computedTotals.totalQuantity.toLocaleString('en-IN')}</strong> · Subtotal: <strong className="text-slate-700 font-mono">₹ {computedTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </p>
              </div>
            </div>
            {!isFormDisabled && (
              <Button type="button" variant="primary" size="sm" onClick={addLineItem} className="self-start sm:self-auto">
                <Plus size={14} className="mr-1.5" /> Add Line Item
              </Button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[1520px] border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider text-left">
                  <th className="px-3.5 py-3 w-12 text-center text-slate-500 whitespace-nowrap">#</th>
                  <th className="px-3.5 py-3 w-[320px] min-w-[320px] whitespace-nowrap">Item Description <span className="text-red-500">*</span></th>
                  <th className="px-3.5 py-3 w-[130px] min-w-[130px] text-center whitespace-nowrap">Item Code</th>
                  <th className="px-3.5 py-3 w-[110px] min-w-[110px] text-right whitespace-nowrap">Quantity <span className="text-red-500">*</span></th>
                  <th className="px-3.5 py-3 w-[140px] min-w-[140px] whitespace-nowrap">UOM <span className="text-red-500">*</span></th>
                  <th className="px-3.5 py-3 w-[140px] min-w-[140px] text-right whitespace-nowrap">Unit Rate (₹) <span className="text-red-500">*</span></th>
                  <th className="px-3.5 py-3 w-[120px] min-w-[120px] text-right whitespace-nowrap">Discount (₹)</th>
                  <th className="px-3.5 py-3 w-[100px] min-w-[100px] text-right whitespace-nowrap">Tax (%)</th>
                  <th className="px-3.5 py-3 w-[160px] min-w-[160px] text-right whitespace-nowrap">Line Total (₹)</th>
                  <th className="px-3.5 py-3 w-[150px] min-w-[150px] whitespace-nowrap">Req. Date</th>
                  <th className="px-3.5 py-3 min-w-[180px] whitespace-nowrap">Specification</th>
                  {!isFormDisabled && <th className="px-3.5 py-3 w-14 text-center whitespace-nowrap">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {computedTotals.itemsWithAmounts.map((line, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-3.5 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    
                    {/* Item Select */}
                    <td className="px-3.5 py-3">
                      <Select
                        value={line.item}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        disabled={isFormDisabled}
                        required
                        size="sm"
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

                    {/* Item Code Badge */}
                    <td className="px-3.5 py-3 text-center">
                      {line.itemCode ? (
                        <span className="inline-block px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-md whitespace-nowrap shadow-2xs">
                          {line.itemCode}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs italic">—</span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="px-3.5 py-3">
                      <input
                        type="number"
                        step="any"
                        min="0.0001"
                        placeholder="0"
                        value={line.quantity || line.requestedQuantity || ''}
                        onChange={(e) => handleLineFieldChange(idx, 'quantity', e.target.value)}
                        disabled={isFormDisabled}
                        required
                        className="w-full px-3 py-1.5 text-xs text-right font-semibold text-slate-900 border border-slate-300 rounded-md bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>

                    {/* UOM Select */}
                    <td className="px-3.5 py-3">
                      <Select
                        value={line.uom}
                        onChange={(e) => handleUomSelect(idx, e.target.value)}
                        disabled={isFormDisabled}
                        required
                        size="sm"
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
                    <td className="px-3.5 py-3">
                      <div className="relative rounded-md shadow-2xs">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs font-semibold text-slate-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.00"
                          value={line.unitRate ?? ''}
                          onChange={(e) => handleLineFieldChange(idx, 'unitRate', e.target.value)}
                          disabled={isFormDisabled}
                          required
                          className="w-full pl-6 pr-3 py-1.5 text-xs text-right font-semibold text-slate-900 border border-slate-300 rounded-md bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </td>

                    {/* Discount */}
                    <td className="px-3.5 py-3">
                      <div className="relative rounded-md shadow-2xs">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs font-semibold text-slate-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={line.discount ?? ''}
                          onChange={(e) => handleLineFieldChange(idx, 'discount', e.target.value)}
                          disabled={isFormDisabled}
                          className="w-full pl-6 pr-3 py-1.5 text-xs text-right text-slate-700 border border-slate-300 rounded-md bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </td>

                    {/* Tax Rate */}
                    <td className="px-3.5 py-3">
                      <div className="relative rounded-md shadow-2xs">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={line.taxRate ?? ''}
                          onChange={(e) => handleLineFieldChange(idx, 'taxRate', e.target.value)}
                          disabled={isFormDisabled}
                          className="w-full pl-2.5 pr-6 py-1.5 text-xs text-right text-slate-700 border border-slate-300 rounded-md bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs font-semibold text-slate-400">
                          %
                        </span>
                      </div>
                    </td>

                    {/* Line Amount (Computed Live Preview) */}
                    <td className="px-3.5 py-3 text-right">
                      <span className="inline-block px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-md font-mono font-bold text-slate-900 text-xs whitespace-nowrap shadow-2xs">
                        ₹ {line.lineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Required Date */}
                    <td className="px-3.5 py-3">
                      <input
                        type="date"
                        value={line.requiredDate || ''}
                        onChange={(e) => handleLineFieldChange(idx, 'requiredDate', e.target.value)}
                        disabled={isFormDisabled}
                        className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-300 rounded-md bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    {/* Specification */}
                    <td className="px-3.5 py-3">
                      <input
                        type="text"
                        placeholder="Specs / Grade / Notes..."
                        value={line.specification || ''}
                        onChange={(e) => handleLineFieldChange(idx, 'specification', e.target.value)}
                        disabled={isFormDisabled}
                        className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-300 rounded-md bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    {/* Remove Action */}
                    {!isFormDisabled && (
                      <td className="px-3.5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="inline-flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove Line Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 text-xs font-semibold text-slate-700">
                <tr>
                  <td colSpan={3} className="px-3.5 py-3 text-right uppercase tracking-wider text-[11px] text-slate-500 font-bold whitespace-nowrap">
                    Totals:
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {computedTotals.totalQuantity.toLocaleString('en-IN')}
                  </td>
                  <td colSpan={4} className="px-3.5 py-3 text-right uppercase tracking-wider text-[11px] text-slate-500 font-bold whitespace-nowrap">
                    Subtotal:
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-blue-700 text-xs whitespace-nowrap">
                    ₹ {computedTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={isFormDisabled ? 2 : 3}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!isFormDisabled && (
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={14} /> Add Another Line Item
              </button>
              <span className="text-[11.5px] text-slate-500">
                {lineItems.length} {lineItems.length === 1 ? 'line item' : 'line items'} in this order
              </span>
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <IndianRupee size={16} className="text-blue-600" /> Order Financial Summary
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹ {computedTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Total Discount:</span>
                <span>- ₹ {computedTotals.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Tax:</span>
                <span>+ ₹ {computedTotals.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Freight & Other Charges:</span>
                <span>+ ₹ {(computedTotals.freight + computedTotals.otherCharges).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-base text-blue-700">₹ {computedTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
