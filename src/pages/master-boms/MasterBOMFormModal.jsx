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
      size="xl"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Section 1: Header Information */}
          <div className="card" style={{ padding: '16px', background: '#f8fafc', margin: 0 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={16} color="var(--primary-600)" />
              Master BOM Header Details
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <FormField label="Effective To Date" helpText="Optional expiration date">
                <Input
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  disabled={submitting}
                />
              </FormField>

              <FormField label="BOM Description" style={{ gridColumn: 'span 2' }}>
                <Input
                  placeholder="e.g. Standard 3-Layer Filter Assembly Structure..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </FormField>
            </div>

            <FormField label="Remarks / Manufacturing Notes" style={{ marginTop: '12px' }}>
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
            <div className="card" style={{ padding: '16px', margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="var(--primary-600)" />
                  BOM Components & Recipe (Required per 1 Parent Unit)
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={handleAddComponentRow} disabled={submitting}>
                  <Plus size={14} style={{ marginRight: '4px' }} /> Add Component
                </Button>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-200)', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--neutral-100)', textTransform: 'uppercase', fontSize: '10.5px', color: 'var(--neutral-600)', textAlign: 'left' }}>
                      <th style={{ padding: '8px', width: '40px' }}>#</th>
                      <th style={{ padding: '8px', minWidth: '220px' }}>Component Item *</th>
                      <th style={{ padding: '8px', width: '100px', textAlign: 'right' }}>Qty / Parent *</th>
                      <th style={{ padding: '8px', width: '120px' }}>UOM *</th>
                      <th style={{ padding: '8px', width: '110px' }}>Tag / Position</th>
                      <th style={{ padding: '8px', width: '100px', textAlign: 'right' }}>Est. Price (₹)</th>
                      <th style={{ padding: '8px', width: '120px' }}>Remarks</th>
                      <th style={{ padding: '8px', width: '50px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((comp, idx) => (
                      <tr key={comp.tempId || idx} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                        <td style={{ padding: '6px 8px', color: 'var(--neutral-500)', verticalAlign: 'middle' }}>{idx + 1}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <Select
                            value={comp.componentItem}
                            onChange={(e) => handleComponentItemChange(idx, e.target.value)}
                            style={{ fontSize: '12px', padding: '4px 6px' }}
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
                        <td style={{ padding: '6px 8px' }}>
                          <Input
                            type="number"
                            step="0.000001"
                            min="0.000001"
                            value={comp.quantityPerParent}
                            onChange={(e) => handleComponentFieldChange(idx, 'quantityPerParent', e.target.value)}
                            style={{ fontSize: '12px', padding: '4px 6px', textAlign: 'right' }}
                            required
                          />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <Select
                            value={comp.uom}
                            onChange={(e) => handleComponentFieldChange(idx, 'uom', e.target.value)}
                            style={{ fontSize: '12px', padding: '4px 6px' }}
                            required
                          >
                            <option value="">-- Select UOM --</option>
                            {uoms.map(u => (
                              <option key={u._id} value={u._id}>
                                {u.unitSymbol || u.unitName}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <Input
                            placeholder="e.g. POS-A"
                            value={comp.positionTagNo}
                            onChange={(e) => handleComponentFieldChange(idx, 'positionTagNo', e.target.value)}
                            style={{ fontSize: '12px', padding: '4px 6px' }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={comp.price}
                            onChange={(e) => handleComponentFieldChange(idx, 'price', e.target.value)}
                            style={{ fontSize: '12px', padding: '4px 6px', textAlign: 'right' }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <Input
                            placeholder="Notes..."
                            value={comp.remarks}
                            onChange={(e) => handleComponentFieldChange(idx, 'remarks', e.target.value)}
                            style={{ fontSize: '12px', padding: '4px 6px' }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => handleRemoveComponentRow(idx)}
                            style={{ color: 'var(--danger-600)' }}
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--neutral-200)' }}>
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
