import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetPurchaseEnquiryByIdQuery,
  useCreatePurchaseEnquiryMutation,
  useUpdatePurchaseEnquiryMutation,
  useGetPurchaseRequisitionsQuery,
  useLazyGetPurchaseRequisitionByIdQuery,
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
  Truck,
  DollarSign,
  UserCheck
} from 'lucide-react';

const PurchaseEnquiryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { user } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Master Data Dropdowns via RTK Query
  const { data: prRes } = useGetPurchaseRequisitionsQuery({ status: 'APPROVED', limit: 100 });
  const [getPRById] = useLazyGetPurchaseRequisitionByIdQuery();
  const { data: supplierRes } = useGetSuppliersQuery({ limit: 200, status: 'active', approvalStatus: 'APPROVED' });
  const { data: clientRes } = useGetClientsQuery({ partyType: 'SUPPLIER', status: 'active', limit: 200 });
  const { data: deptRes } = useGetDepartmentsQuery();
  const { data: itemRes } = useGetItemsQuery({ limit: 1000 });
  const { data: uomRes } = useGetUOMsQuery();

  const approvedPrs = useMemo(() => {
    return prRes?.purchaseRequisitions || prRes?.requisitions || [];
  }, [prRes]);

  const suppliers = useMemo(() => {
    const supplierList = supplierRes?.suppliers || supplierRes?.data?.suppliers || [];
    const partyList = clientRes?.clients || clientRes?.parties || [];

    const list = [
      ...supplierList.map((s) => ({
        _id: s._id,
        name: s.supplierName || s.legalName,
        code: s.supplierCode,
        status: s.status,
      })),
      ...partyList
        .filter((p) => p.status === 'active' && ['SUPPLIER', 'BOTH'].includes(p.partyType))
        .map((p) => ({
          _id: p._id,
          name: p.companyName,
          code: p.partyCode,
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

  // Existing PE via RTK Query
  const {
    data: existingPeRes,
    isLoading: initialLoading,
    error: loadError,
  } = useGetPurchaseEnquiryByIdQuery(id, { skip: !isEditMode });

  const [createPurchaseEnquiryMutation, { isLoading: isCreating }] = useCreatePurchaseEnquiryMutation();
  const [updatePurchaseEnquiryMutation, { isLoading: isUpdating }] = useUpdatePurchaseEnquiryMutation();
  const loading = submitting || isCreating || isUpdating;

  // Form Header State
  const [purchaseRequisition, setPurchaseRequisition] = useState('');
  const [prNumber, setPrNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [department, setDepartment] = useState('');
  const [enquiryDate, setEnquiryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedResponseDate, setExpectedResponseDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [validityDate, setValidityDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [deliveryRequirements, setDeliveryRequirements] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [remarks, setRemarks] = useState('');
  const [peStatus, setPeStatus] = useState('DRAFT');

  // Form Line Items State
  const [lineItems, setLineItems] = useState([
    {
      item: '',
      itemCode: '',
      itemName: '',
      requestedQuantity: 1,
      uom: '',
      uomCode: '',
      requiredDate: '',
      specification: '',
      remarks: ''
    }
  ]);

  // Populate Existing PE when loaded
  useEffect(() => {
    if (existingPeRes?.purchaseEnquiry) {
      const pe = existingPeRes.purchaseEnquiry;
      setPeStatus(pe.status);

      if (pe.status !== 'DRAFT') {
        setError(`Purchase Enquiry "${pe.enquiryNumber}" is in status '${pe.status}' and cannot be edited. Only DRAFT enquiries can be updated.`);
      }

      setPurchaseRequisition(pe.purchaseRequisition?._id || pe.purchaseRequisition || '');
      setPrNumber(pe.prNumber || pe.purchaseRequisition?.prNumber || '');
      setSupplier(pe.supplier?._id || pe.supplier || '');
      setDepartment(pe.department?._id || pe.department || '');
      setEnquiryDate(pe.enquiryDate ? new Date(pe.enquiryDate).toISOString().split('T')[0] : '');
      setExpectedResponseDate(pe.expectedResponseDate ? new Date(pe.expectedResponseDate).toISOString().split('T')[0] : '');
      setValidityDate(pe.validityDate ? new Date(pe.validityDate).toISOString().split('T')[0] : '');
      setDeliveryRequirements(pe.deliveryRequirements || '');
      setPaymentTerms(pe.paymentTerms || '');
      setDeliveryTerms(pe.deliveryTerms || '');
      setRemarks(pe.remarks || '');

      if (Array.isArray(pe.items) && pe.items.length > 0) {
        setLineItems(
          pe.items.map((i) => ({
            item: i.item?._id || i.item || '',
            itemCode: i.itemCode || i.item?.itemCode || '',
            itemName: i.itemName || i.item?.itemName || '',
            requestedQuantity: i.requestedQuantity || 1,
            uom: i.uom?._id || i.uom || '',
            uomCode: i.uomCode || i.uom?.uomCode || '',
            requiredDate: i.requiredDate ? new Date(i.requiredDate).toISOString().split('T')[0] : '',
            specification: i.specification || '',
            remarks: i.remarks || ''
          }))
        );
      }
    }
  }, [existingPeRes]);

  // Handle Approved Purchase Requisition Selection
  const handlePRChange = async (prId) => {
    setPurchaseRequisition(prId);
    if (!prId) {
      setPrNumber('');
      return;
    }

    try {
      const targetPR = approvedPrs.find((p) => p._id === prId);
      let fullPR = targetPR;

      // Fetch full PR details if items aren't completely populated
      if (!targetPR || !targetPR.items || targetPR.items.length === 0) {
        const res = await getPRById(prId).unwrap();
        if (res?.purchaseRequisition) {
          fullPR = res.purchaseRequisition;
        }
      }

      if (fullPR) {
        setPrNumber(fullPR.prNumber || '');
        
        // Auto populate department
        const deptId = typeof fullPR.department === 'object' ? fullPR.department._id : fullPR.department;
        if (deptId) {
          setDepartment(deptId);
        }

        // Pre-populate line items from PR
        if (Array.isArray(fullPR.items) && fullPR.items.length > 0) {
          setLineItems(
            fullPR.items.map((i) => ({
              item: i.item?._id || i.item || '',
              itemCode: i.itemCode || i.item?.itemCode || '',
              itemName: i.itemName || i.item?.itemName || '',
              requestedQuantity: i.requestedQuantity || 1,
              uom: i.uom?._id || i.uom || '',
              uomCode: i.uomCode || i.uom?.uomCode || '',
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
      console.error('Failed to populate from selected PR:', err);
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
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        item: '',
        itemCode: '',
        itemName: '',
        requestedQuantity: 1,
        uom: '',
        uomCode: '',
        requiredDate: '',
        specification: '',
        remarks: ''
      }
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) {
      setError('A Purchase Enquiry must contain at least one line item.');
      return;
    }
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

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
    if (!expectedResponseDate) {
      setError('Expected Response Date is required.');
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
      const qty = Number(line.requestedQuantity);
      if (Number.isNaN(qty) || qty <= 0) {
        setError(`Line Item #${lineNo}: Requested quantity must be greater than 0.`);
        return;
      }
    }

    const payload = {
      purchaseRequisition: purchaseRequisition || null,
      supplier,
      department,
      expectedResponseDate,
      validityDate: validityDate || null,
      deliveryRequirements,
      paymentTerms,
      deliveryTerms,
      remarks,
      items: lineItems.map((li) => ({
        item: li.item,
        requestedQuantity: Number(li.requestedQuantity),
        uom: li.uom,
        requiredDate: li.requiredDate || null,
        specification: li.specification || '',
        remarks: li.remarks || ''
      }))
    };

    setSubmitting(true);
    try {
      let res;
      if (isEditMode) {
        res = await updatePurchaseEnquiryMutation({ id, ...payload }).unwrap();
      } else {
        res = await createPurchaseEnquiryMutation(payload).unwrap();
      }

      const savedPE = res?.purchaseEnquiry || res;
      setSuccess(res?.message || 'Purchase Enquiry saved successfully.');
      setTimeout(() => {
        navigate(`/purchase-enquiries/${savedPE._id || id}`);
      }, 800);
    } catch (err) {
      console.error('Save Purchase Enquiry Error:', err);
      setError(err?.data?.message || err.message || 'Error saving Purchase Enquiry. Please check form inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-xs font-semibold">Loading Purchase Enquiry details...</span>
      </div>
    );
  }

  const isFormDisabled = isEditMode && peStatus !== 'DRAFT';
  const totalRequestedQty = lineItems.reduce((sum, item) => sum + (Number(item.requestedQuantity) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? 'Edit Purchase Enquiry' : 'Create Purchase Enquiry'}
        subtitle={isEditMode ? 'Update DRAFT purchase enquiry header and line items.' : 'Generate a supplier quotation request against an Approved Purchase Requisition or direct procurement.'}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/purchase-enquiries')}
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Enquiries
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
            Enquiry Header & Parties Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Purchase Requisition Selection */}
            <FormField label="Source Purchase Requisition (Approved Only)">
              <Select
                value={purchaseRequisition}
                onChange={(e) => handlePRChange(e.target.value)}
                disabled={isFormDisabled || isEditMode}
              >
                <option value="">-- Select Approved PR (Optional) --</option>
                {approvedPrs.map((pr) => (
                  <option key={pr._id} value={pr._id}>
                    {pr.prNumber} ({pr.requestingEmployee?.fullName || 'PR'} - {new Date(pr.prDate).toLocaleDateString('en-GB')})
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
                    {sup.name} ({sup.code})
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

            {/* Enquiry Date */}
            <FormField label="Enquiry Date" required>
              <Input
                type="date"
                value={enquiryDate}
                onChange={(e) => setEnquiryDate(e.target.value)}
                disabled={isFormDisabled}
                required
              />
            </FormField>

            {/* Expected Response Date */}
            <FormField label="Expected Response Date" required>
              <Input
                type="date"
                value={expectedResponseDate}
                onChange={(e) => setExpectedResponseDate(e.target.value)}
                disabled={isFormDisabled}
                required
              />
            </FormField>

            {/* Validity Date */}
            <FormField label="Offer Validity Date">
              <Input
                type="date"
                value={validityDate}
                onChange={(e) => setValidityDate(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Delivery Requirements */}
            <FormField label="Delivery Requirements" className="lg:col-span-2">
              <Input
                type="text"
                placeholder="e.g. Door delivery to Plant 1 within 14 days"
                value={deliveryRequirements}
                onChange={(e) => setDeliveryRequirements(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Payment Terms */}
            <FormField label="Payment Terms" className="lg:col-span-2">
              <Input
                type="text"
                placeholder="e.g. 30 Days Net from GRN date"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Delivery Terms */}
            <FormField label="Delivery Terms (Incoterms)" className="lg:col-span-2">
              <Input
                type="text"
                placeholder="e.g. FOR Destination / Ex-Works"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Header Remarks */}
            <FormField label="Enquiry Remarks / Instructions" className="lg:col-span-4">
              <Textarea
                placeholder="Additional notes or quotation instructions for supplier..."
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
                  <h3 className="text-sm font-bold text-slate-800">Enquiry Line Items</h3>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {lineItems.length} {lineItems.length === 1 ? 'line item' : 'line items'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Total Requested Quantity: <strong className="text-slate-700">{totalRequestedQty.toLocaleString('en-IN')}</strong>
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
            <table className="w-full min-w-[1240px] border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider text-left">
                  <th className="px-3.5 py-3 w-12 text-center text-slate-500 whitespace-nowrap">#</th>
                  <th className="px-3.5 py-3 w-[320px] min-w-[320px] whitespace-nowrap">Item Description <span className="text-red-500">*</span></th>
                  <th className="px-3.5 py-3 w-[130px] min-w-[130px] text-center whitespace-nowrap">Item Code</th>
                  <th className="px-3.5 py-3 w-[120px] min-w-[120px] text-right whitespace-nowrap">Quantity <span className="text-red-500">*</span></th>
                  <th className="px-3.5 py-3 w-[140px] min-w-[140px] whitespace-nowrap">UOM <span className="text-red-500">*</span></th>
                  <th className="px-3.5 py-3 w-[150px] min-w-[150px] whitespace-nowrap">Required Date</th>
                  <th className="px-3.5 py-3 min-w-[180px] whitespace-nowrap">Specification</th>
                  <th className="px-3.5 py-3 min-w-[160px] whitespace-nowrap">Remarks</th>
                  {!isFormDisabled && <th className="px-3.5 py-3 w-14 text-center whitespace-nowrap">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((line, idx) => (
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
                        value={line.requestedQuantity || ''}
                        onChange={(e) => handleLineFieldChange(idx, 'requestedQuantity', e.target.value)}
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

                    {/* Required Date */}
                    <td className="px-3 py-3">
                      <input
                        type="date"
                        value={line.requiredDate || ''}
                        onChange={(e) => handleLineFieldChange(idx, 'requiredDate', e.target.value)}
                        disabled={isFormDisabled}
                        className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-300 rounded-md bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    {/* Specification */}
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        placeholder="Grade, specs, details..."
                        value={line.specification || ''}
                        onChange={(e) => handleLineFieldChange(idx, 'specification', e.target.value)}
                        disabled={isFormDisabled}
                        className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-300 rounded-md bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    {/* Remarks */}
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        placeholder="Line item note..."
                        value={line.remarks || ''}
                        onChange={(e) => handleLineFieldChange(idx, 'remarks', e.target.value)}
                        disabled={isFormDisabled}
                        className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-300 rounded-md bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    {/* Remove Action */}
                    {!isFormDisabled && (
                      <td className="px-3 py-3 text-center">
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
                  <td colSpan={3} className="px-3 py-2.5 text-right uppercase tracking-wider text-[11px] text-slate-500 font-bold">
                    Total Quantity:
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                    {totalRequestedQty.toLocaleString('en-IN')}
                  </td>
                  <td colSpan={isFormDisabled ? 4 : 5}></td>
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
                {lineItems.length} {lineItems.length === 1 ? 'line item' : 'line items'} in this enquiry
              </span>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTONS BAR */}
        <div className="flex items-center justify-end gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/purchase-enquiries')}
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
              {loading ? 'Saving...' : isEditMode ? 'Update Purchase Enquiry' : 'Save as Draft Enquiry'}
            </Button>
          )}
        </div>

      </form>
    </div>
  );
};

export default PurchaseEnquiryForm;
