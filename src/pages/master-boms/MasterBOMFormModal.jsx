import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select, Textarea, FormField } from '../../components/ui/FormField';
import { getItems } from '../../services/itemService';
import { getUOMs } from '../../services/uomService';
import { createBOM, updateBOM, addBOMItem, updateBOMItem, deleteBOMItem } from '../../services/masterBomService';
import { Plus, Trash2, Layers, Package, AlertCircle } from 'lucide-react';

const MasterBOMFormModal = ({ isOpen, bom, onClose, onSuccess }) => {
  const isEdit = Boolean(bom);

  // Dropdown lists
  const [items, setItems] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Header Fields
  const [parentItem, setParentItem] = useState('');
  const [bomCode, setBomCode] = useState('');
  const [description, setDescription] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [effectiveTo, setEffectiveTo] = useState('');
  const [remarks, setRemarks] = useState('');

  // Component Items List State (for Create & Edit)
  const [components, setComponents] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadMasterData = async () => {
      setLoadingData(true);
      setError('');
      try {
        const [itemRes, uomRes] = await Promise.all([
          getItems(),
          getUOMs()
        ]);

        if (itemRes.success && Array.isArray(itemRes.items)) {
          setItems(itemRes.items.filter(i => i.status === 'active'));
        }
        if (uomRes.success && Array.isArray(uomRes.uoms)) {
          setUoms(uomRes.uoms.filter(u => u.status === 'active'));
        }
      } catch (err) {
        console.error('Failed to load master data:', err);
        setError('Failed to fetch items or UOMs from server.');
      } finally {
        setLoadingData(false);
      }
    };

    loadMasterData();

    if (bom) {
      const pId = typeof bom.parentItem === 'object' ? bom.parentItem?._id : bom.parentItem;
      setParentItem(pId || '');
      setBomCode(bom.bomCode || '');
      setDescription(bom.description || '');
      setEffectiveFrom(bom.effectiveFrom ? new Date(bom.effectiveFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setEffectiveTo(bom.effectiveTo ? new Date(bom.effectiveTo).toISOString().split('T')[0] : '');
      setRemarks(bom.remarks || '');
    } else {
      setParentItem('');
      setBomCode('');
      setDescription('');
      setEffectiveFrom(new Date().toISOString().split('T')[0]);
      setEffectiveTo('');
      setRemarks('');
      setComponents([
        { tempId: Date.now(), componentItem: '', quantityPerParent: 1, uom: '', positionTagNo: '', price: 0, sequence: 10, remarks: '' }
      ]);
    }
  }, [isOpen, bom]);

  // Handle component selection change & auto-populate UOM
  const handleComponentItemChange = (index, componentItemId) => {
    const updated = [...components];
    updated[index].componentItem = componentItemId;

    // Auto-fill UOM from selected item's inventoryUom if available
    const selectedItemObj = items.find(i => i._id === componentItemId);
    if (selectedItemObj && selectedItemObj.inventoryUom) {
      const uomId = typeof selectedItemObj.inventoryUom === 'object'
        ? selectedItemObj.inventoryUom._id
        : selectedItemObj.inventoryUom;
      updated[index].uom = uomId;
    }

    setComponents(updated);
  };

  const handleComponentFieldChange = (index, field, value) => {
    const updated = [...components];
    updated[index][field] = value;
    setComponents(updated);
  };

  const handleAddComponentRow = () => {
    setComponents([
      ...components,
      {
        tempId: Date.now() + Math.random(),
        componentItem: '',
        quantityPerParent: 1,
        uom: '',
        positionTagNo: '',
        price: 0,
        sequence: (components.length + 1) * 10,
        remarks: ''
      }
    ]);
  };

  const handleRemoveComponentRow = (index) => {
    if (components.length === 1) {
      setError('A Master BOM requires at least 1 component item.');
      return;
    }
    setComponents(components.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!parentItem) {
      setError('Please select a Parent Item.');
      return false;
    }

    if (components.length === 0) {
      setError('At least one component item is required.');
      return false;
    }

    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      if (!comp.componentItem) {
        setError(`Row ${i + 1}: Please select a Component Item.`);
        return false;
      }
      if (comp.componentItem === parentItem) {
        setError(`Row ${i + 1}: Parent item cannot be added as its own component.`);
        return false;
      }
      const qty = Number(comp.quantityPerParent);
      if (Number.isNaN(qty) || qty <= 0) {
        setError(`Row ${i + 1}: Quantity per parent must be greater than 0.`);
        return false;
      }
      if (!comp.uom) {
        setError(`Row ${i + 1}: Please select a UOM.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');

    try {
      if (!isEdit) {
        // CREATE BOM
        const payload = {
          parentItem,
          bomCode: bomCode.trim() || undefined,
          description: description.trim(),
          effectiveFrom: effectiveFrom || new Date(),
          effectiveTo: effectiveTo || null,
          remarks: remarks.trim(),
          items: components.map(c => ({
            componentItem: c.componentItem,
            quantityPerParent: Number(c.quantityPerParent),
            uom: c.uom,
            positionTagNo: c.positionTagNo.trim(),
            price: Number(c.price) || 0,
            sequence: Number(c.sequence) || 0,
            remarks: c.remarks.trim()
          }))
        };

        const res = await createBOM(payload);
        if (res.success) {
          onSuccess();
        } else {
          setError(res.message || 'Failed to create Master BOM');
        }
      } else {
        // EDIT DRAFT BOM HEADER
        const headerPayload = {
          parentItem,
          description: description.trim(),
          effectiveFrom: effectiveFrom || new Date(),
          effectiveTo: effectiveTo || null,
          remarks: remarks.trim()
        };

        const res = await updateBOM(bom._id, headerPayload);
        if (res.success) {
          onSuccess();
        } else {
          setError(res.message || 'Failed to update Master BOM header');
        }
      }
    } catch (err) {
      console.error('Master BOM form error:', err);
      setError(err.response?.data?.message || 'Server error saving Master BOM');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Draft Master BOM — ${bom.bomCode}` : 'Create Master BOM'}
      size="2xl"
      maxWidth="1150px"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">

          {/* Section 1: Header Information */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <h4 className="mb-3 text-[13.5px] font-semibold text-slate-900 flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              Master BOM Header Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <FormField label="Parent Item (Finished Good)" required>
                <Select
                  value={parentItem}
                  onChange={(e) => setParentItem(e.target.value)}
                  disabled={loadingData || submitting}
                  required
                >
                  <option value="">-- Select Parent Item --</option>
                  {items.map(it => (
                    <option key={it._id} value={it._id}>
                      {it.itemCode} — {it.itemName}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="BOM Code" helpText="Leave blank for automatic BOM-00000X generation">
                <Input
                  placeholder="AUTO"
                  value={bomCode}
                  onChange={(e) => setBomCode(e.target.value)}
                  disabled={isEdit || submitting}
                />
              </FormField>

              <FormField label="Effective From Date">
                <Input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  disabled={submitting}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField label="Effective To Date" helpText="Optional expiration date">
                <Input
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  disabled={submitting}
                />
              </FormField>

              <FormField label="BOM Description" className="md:col-span-2">
                <Input
                  placeholder="e.g. Standard 3-Layer Filter Assembly Structure..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </FormField>
            </div>

            <FormField label="Remarks / Manufacturing Notes" className="mt-3">
              <Textarea
                rows={2}
                placeholder="Special assembly instructions or material notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={submitting}
              />
            </FormField>
          </div>

          {/* Section 2: Component Builder Grid (Only for Create mode) */}
          {!isEdit && (
            <div className="p-4 bg-white border border-slate-200 rounded-md">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[13.5px] font-semibold text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-blue-600" />
                  BOM Components & Recipe (Required per 1 Parent Unit)
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={handleAddComponentRow} disabled={submitting}>
                  <Plus size={14} className="mr-1" /> Add Component
                </Button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 uppercase text-[11px] text-slate-600 font-semibold text-left">
                      <th className="p-2.5 w-10">#</th>
                      <th className="p-2.5 min-w-[280px]">Component Item *</th>
                      <th className="p-2.5 w-30 text-right">Qty / Parent *</th>
                      <th className="p-2.5 w-40">UOM *</th>
                      <th className="p-2.5 w-32">Tag / Position</th>
                      <th className="p-2.5 w-32 text-right">Est. Price (₹)</th>
                      <th className="p-2.5 w-44">Remarks</th>
                      <th className="p-2.5 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((comp, idx) => (
                      <tr key={comp.tempId || idx} className="border-b border-slate-100">
                        <td className="p-2 text-slate-500 align-middle font-semibold">{idx + 1}</td>
                        <td className="p-2">
                          <Select
                            value={comp.componentItem}
                            onChange={(e) => handleComponentItemChange(idx, e.target.value)}
                            required
                          >
                            <option value="">-- Select Component Item --</option>
                            {items
                              .filter(it => it._id !== parentItem) // Exclude parent item
                              .map(it => (
                                <option key={it._id} value={it._id}>
                                  {it.itemCode} — {it.itemName}
                                </option>
                              ))}
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.000001"
                            min="0.000001"
                            value={comp.quantityPerParent}
                            onChange={(e) => handleComponentFieldChange(idx, 'quantityPerParent', e.target.value)}
                            className="text-right"
                            required
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            value={comp.uom}
                            onChange={(e) => handleComponentFieldChange(idx, 'uom', e.target.value)}
                            required
                          >
                            <option value="">-- Select UOM --</option>
                            {uoms.map(u => (
                              <option key={u._id} value={u._id}>
                                {u.uomCode ? `${u.uomCode} — ${u.uomName}` : u.uomName || u.uomCode || 'Unit'}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            placeholder="e.g. POS-A"
                            value={comp.positionTagNo}
                            onChange={(e) => handleComponentFieldChange(idx, 'positionTagNo', e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={comp.price}
                            onChange={(e) => handleComponentFieldChange(idx, 'price', e.target.value)}
                            className="text-right"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            placeholder="Notes..."
                            value={comp.remarks}
                            onChange={(e) => handleComponentFieldChange(idx, 'remarks', e.target.value)}
                          />
                        </td>
                        <td className="p-2 text-center align-middle">
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => handleRemoveComponentRow(idx)}
                            className="text-red-600 hover:text-red-700"
                            title="Remove Component"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 mt-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving Master BOM...' : isEdit ? 'Save Header Changes' : 'Create Master BOM'}
            </Button>
          </div>

        </div>
      </form>
    </Modal>
  );
};

export default MasterBOMFormModal;
