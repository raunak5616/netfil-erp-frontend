import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPurchaseEnquiryById,
  createPurchaseEnquiry,
  updatePurchaseEnquiry
} from '../../services/purchaseEnquiryService';
import { getPurchaseRequisitions, getPurchaseRequisitionById } from '../../services/purchaseRequisitionService';
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
  Truck,
  DollarSign,
  UserCheck
} from 'lucide-react';

const PurchaseEnquiryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Master Data Dropdowns
  const [approvedPrs, setApprovedPrs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [uomsList, setUomsList] = useState([]);

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

  // Load Master Data
  const loadMasterData = async () => {
    try {
      const [prRes, supplierRes, deptRes, itemRes, uomRes] = await Promise.all([
        getPurchaseRequisitions({ status: 'APPROVED', limit: 100 }).catch(() => ({ success: false, purchaseRequisitions: [] })),
        getClients({ partyType: 'SUPPLIER', status: 'active', limit: 100 }).catch(() => ({ success: false, clients: [], parties: [] })),
        getDepartments().catch(() => ({ success: false, departments: [] })),
        getItems().catch(() => ({ success: false, items: [] })),
        getUOMs().catch(() => ({ success: false, uoms: [] }))
      ]);

      if (prRes.success && Array.isArray(prRes.purchaseRequisitions)) {
        setApprovedPrs(prRes.purchaseRequisitions);
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
      console.error('Failed to load PE master data:', err);
      setError('Failed to load required master data.');
    }
  };

  // Load Existing PE for Edit
  const loadExistingPE = async () => {
    if (!id) return;
    setInitialLoading(true);
    setError('');
    try {
      const res = await getPurchaseEnquiryById(id);
      if (res.success && res.purchaseEnquiry) {
        const pe = res.purchaseEnquiry;
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
      } else {
        setError('Purchase Enquiry not found.');
      }
    } catch (err) {
      console.error('Failed to fetch Purchase Enquiry:', err);
      setError(err.response?.data?.message || 'Error loading Purchase Enquiry details');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadMasterData();
      if (isEditMode) {
        await loadExistingPE();
      }
    };
    init();
  }, [id]);

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
        const res = await getPurchaseRequisitionById(prId);
        if (res.success && res.purchaseRequisition) {
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

    setLoading(true);
    try {
      let res;
      if (isEditMode) {
        res = await updatePurchaseEnquiry(id, payload);
      } else {
        res = await createPurchaseEnquiry(payload);
      }

      if (res.success && res.purchaseEnquiry) {
        setSuccess(res.message || 'Purchase Enquiry saved successfully.');
        setTimeout(() => {
          navigate(`/purchase-enquiries/${res.purchaseEnquiry._id}`);
        }, 800);
      } else {
        setError(res.message || 'Failed to save Purchase Enquiry.');
      }
    } catch (err) {
      console.error('Save Purchase Enquiry Error:', err);
      setError(err.response?.data?.message || 'Error saving Purchase Enquiry. Please check form inputs.');
    } finally {
      setLoading(false);
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
                    {sup.companyName} ({sup.partyCode})
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
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              Enquiry Line Items ({lineItems.length}) — Total Qty: {totalRequestedQty.toLocaleString('en-IN')}
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
                  <th className="px-3 py-2 min-w-[200px]">Item <span className="text-red-500">*</span></th>
                  <th className="px-3 py-2 w-28">Item Code</th>
                  <th className="px-3 py-2 w-28">Qty <span className="text-red-500">*</span></th>
                  <th className="px-3 py-2 w-32">UOM <span className="text-red-500">*</span></th>
                  <th className="px-3 py-2 w-36">Required Date</th>
                  <th className="px-3 py-2 min-w-[160px]">Specification</th>
                  <th className="px-3 py-2 min-w-[140px]">Remarks</th>
                  {!isFormDisabled && <th className="px-3 py-2 w-12 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((line, idx) => (
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
                        value={line.requestedQuantity}
                        onChange={(e) => handleLineFieldChange(idx, 'requestedQuantity', e.target.value)}
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
                        placeholder="Grade, specs..."
                        value={line.specification}
                        onChange={(e) => handleLineFieldChange(idx, 'specification', e.target.value)}
                        disabled={isFormDisabled}
                      />
                    </td>

                    {/* Remarks */}
                    <td className="px-3 py-2">
                      <Input
                        type="text"
                        placeholder="Line note..."
                        value={line.remarks}
                        onChange={(e) => handleLineFieldChange(idx, 'remarks', e.target.value)}
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
