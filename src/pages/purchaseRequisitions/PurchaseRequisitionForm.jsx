import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPurchaseRequisitionById,
  createPurchaseRequisition,
  updatePurchaseRequisition
} from '../../services/purchaseRequisitionService';
import { getDepartments } from '../../services/departmentService';
import { getEmployees } from '../../services/employeeService';
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
  Layers,
  Calendar,
  Building2,
  User,
  AlertCircle
} from 'lucide-react';

const PurchaseRequisitionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Master Data Dropdowns
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [uomsList, setUomsList] = useState([]);

  // Form Header State
  const [requestingEmployee, setRequestingEmployee] = useState('');
  const [department, setDepartment] = useState('');
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [referenceType, setReferenceType] = useState('MANUAL');
  const [referenceId, setReferenceId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [prStatus, setPrStatus] = useState('DRAFT');

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
      const [empRes, deptRes, itemRes, uomRes] = await Promise.all([
        getEmployees().catch(() => ({ success: false, employees: [] })),
        getDepartments().catch(() => ({ success: false, departments: [] })),
        getItems().catch(() => ({ success: false, items: [] })),
        getUOMs().catch(() => ({ success: false, uoms: [] }))
      ]);

      if (empRes.success && Array.isArray(empRes.employees)) {
        setEmployees(empRes.employees.filter((e) => e.status === 'active'));
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
      console.error('Failed to load master data:', err);
      setError('Failed to load required master data.');
    }
  };

  // Load Existing PR for Edit
  const loadExistingPR = async () => {
    if (!id) return;
    setInitialLoading(true);
    setError('');
    try {
      const res = await getPurchaseRequisitionById(id);
      if (res.success && res.purchaseRequisition) {
        const pr = res.purchaseRequisition;
        setPrStatus(pr.status);

        if (pr.status !== 'DRAFT') {
          setError(`Purchase Requisition "${pr.prNumber}" is in status '${pr.status}' and cannot be edited. Only DRAFT requisitions can be updated.`);
        }

        setRequestingEmployee(pr.requestingEmployee?._id || pr.requestingEmployee || '');
        setDepartment(pr.department?._id || pr.department || '');
        setPurpose(pr.purpose || '');
        setPriority(pr.priority || 'MEDIUM');
        setRequiredDate(pr.requiredDate ? new Date(pr.requiredDate).toISOString().split('T')[0] : '');
        setReferenceType(pr.referenceType || 'MANUAL');
        setReferenceId(pr.referenceId || '');
        setRemarks(pr.remarks || '');

        if (Array.isArray(pr.items) && pr.items.length > 0) {
          setLineItems(
            pr.items.map((i) => ({
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
        setError('Purchase Requisition not found');
      }
    } catch (err) {
      console.error('Failed to fetch Purchase Requisition:', err);
      setError(err.response?.data?.message || 'Error loading Purchase Requisition details');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadMasterData();
      if (isEditMode) {
        await loadExistingPR();
      }
    };
    init();
  }, [id]);

  // Handle Employee selection change (auto-select department if available)
  const handleEmployeeChange = (empId) => {
    setRequestingEmployee(empId);
    if (empId) {
      const selectedEmp = employees.find((e) => e._id === empId);
      if (selectedEmp && selectedEmp.department) {
        const deptId = typeof selectedEmp.department === 'object' ? selectedEmp.department._id : selectedEmp.department;
        setDepartment(deptId);
      }
    }
  };

  // Line Item change handlers
  const handleItemSelect = (index, itemId) => {
    const updated = [...lineItems];
    const targetItem = itemsList.find((i) => i._id === itemId);

    if (targetItem) {
      // Find matching default UOM
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
      setError('A Purchase Requisition must contain at least one line item.');
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
    if (!requestingEmployee) {
      setError('Requesting Employee is required.');
      return;
    }
    if (!department) {
      setError('Department is required.');
      return;
    }
    if (!requiredDate) {
      setError('Header Required Date is required.');
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
      requestingEmployee,
      department,
      purpose,
      priority,
      requiredDate,
      referenceType,
      referenceId,
      remarks,
      items: lineItems.map((li) => ({
        item: li.item,
        requestedQuantity: Number(li.requestedQuantity),
        uom: li.uom,
        requiredDate: li.requiredDate || requiredDate,
        specification: li.specification || '',
        remarks: li.remarks || ''
      }))
    };

    setLoading(true);
    try {
      let res;
      if (isEditMode) {
        res = await updatePurchaseRequisition(id, payload);
      } else {
        res = await createPurchaseRequisition(payload);
      }

      if (res.success && res.purchaseRequisition) {
        setSuccess(res.message || 'Purchase Requisition saved successfully.');
        setTimeout(() => {
          navigate(`/purchase-requisitions/${res.purchaseRequisition._id}`);
        }, 800);
      } else {
        setError(res.message || 'Failed to save Purchase Requisition.');
      }
    } catch (err) {
      console.error('Save Purchase Requisition Error:', err);
      setError(err.response?.data?.message || 'Error saving Purchase Requisition. Please check form inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-xs font-semibold">Loading Purchase Requisition details...</span>
      </div>
    );
  }

  const isFormDisabled = isEditMode && prStatus !== 'DRAFT';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? 'Edit Purchase Requisition' : 'Create Purchase Requisition'}
        subtitle={isEditMode ? 'Update DRAFT purchase requisition headers and line items.' : 'Submit a new internal material request for departmental procurement.'}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/purchase-requisitions')}
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Requisitions
          </Button>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* HEADER DETAILS CARD */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            Requisition General Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Requesting Employee */}
            <FormField label="Requesting Employee" required>
              <Select
                value={requestingEmployee}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                disabled={isFormDisabled}
                required
              >
                <option value="">-- Select Employee --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName || emp.employeeCode} {emp.designation ? `(${emp.designation})` : ''}
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

            {/* Priority */}
            <FormField label="Priority" required>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isFormDisabled}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </FormField>

            {/* Required Date */}
            <FormField label="Header Required Date" required>
              <Input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                disabled={isFormDisabled}
                required
              />
            </FormField>

            {/* Purpose */}
            <FormField label="Purpose / Justification" className="lg:col-span-2">
              <Input
                type="text"
                placeholder="Reason for material requisition..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Reference Type */}
            <FormField label="Reference Type">
              <Select
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value)}
                disabled={isFormDisabled}
              >
                <option value="MANUAL">Manual</option>
                <option value="SALES_ORDER">Sales Order</option>
                <option value="WORK_ORDER">Work Order</option>
                <option value="MIN_STOCK">Min Stock Level</option>
                <option value="BOM">Bill of Materials (BOM)</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormField>

            {/* Reference ID */}
            <FormField label="Reference ID / Number">
              <Input
                type="text"
                placeholder="e.g. SO-00012, WO-00045"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Header Remarks */}
            <FormField label="General Remarks" className="lg:col-span-4">
              <Textarea
                placeholder="Additional notes for procurement team..."
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
              Requisition Line Items ({lineItems.length})
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

                    {/* Item Code (Readonly) */}
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
                        placeholder="Grade, size, tolerances..."
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
            onClick={() => navigate('/purchase-requisitions')}
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
              {loading ? 'Saving...' : isEditMode ? 'Update Purchase Requisition' : 'Save as Draft Requisition'}
            </Button>
          )}
        </div>

      </form>
    </div>
  );
};

export default PurchaseRequisitionForm;
