import React, { useState, useEffect } from 'react';
import { createItem, updateItem, getItemSpecifications, assignItemSpecification, updateItemSpecification, removeItemSpecification } from '../../services/itemService';
import { getItemGroups } from '../../services/itemGroupService';
import { getItemCategories, getCategorySpecifications } from '../../services/itemCategoryService';
import { getUOMs } from '../../services/uomService';
import { getBins } from '../../services/binService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';

const ItemFormModal = ({ item, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!item;

  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'uom' | 'inventory' | 'specifications'

  const [formData, setFormData] = useState({
    itemCode: 'AUTO',
    itemName: '',
    itemGroup: '',
    itemCategory: '',
    inventoryUom: '',
    purchaseUom: '',
    salesUom: '',
    itemPerPurchaseUnit: 1,
    itemPerSalesUnit: 1,
    hsnCode: '',
    reorderLevel: 0,
    reorderQty: 0,
    minInventory: 0,
    maxInventory: 0,
    leadTimeDays: 0,
    defaultBin: '',
    description: '',
    itemType: 'standard',
    status: 'active',
  });

  // Specification state: map of specId -> { value, isApply, isFix, printSerial, existingSpecId }
  const [specsData, setSpecsData] = useState({});

  // Options master data lists
  const [itemGroups, setItemGroups] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [bins, setBins] = useState([]);
  const [categorySpecs, setCategorySpecs] = useState([]);

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch dropdown master records when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchMasterData = async () => {
      setLoadingData(true);
      setErrorMessage('');
      try {
        const [groupRes, catRes, uomRes, binRes] = await Promise.all([
          getItemGroups(),
          getItemCategories(),
          getUOMs(),
          getBins().catch(() => ({ success: true, bins: [] })), // Graceful fallback if bins list empty
        ]);

        const groupsArray = groupRes.itemGroups || groupRes.groups;
        if (groupRes.success && Array.isArray(groupsArray)) {
          setItemGroups(groupsArray.filter((g) => g.status === 'active'));
        }
        const categoriesArray = catRes.itemCategories || catRes.categories;
        if (catRes.success && Array.isArray(categoriesArray)) {
          setItemCategories(categoriesArray.filter((c) => c.status === 'active'));
        }
        if (uomRes.success && Array.isArray(uomRes.uoms)) {
          setUoms(uomRes.uoms.filter((u) => u.status === 'active'));
        }
        if (binRes.success && Array.isArray(binRes.bins)) {
          setBins(binRes.bins.filter((b) => b.status === 'active'));
        }
      } catch (err) {
        console.error("Failed to load Item master option lists:", err);
        setErrorMessage("Could not load Item master options. Please try again.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchMasterData();

    // Populate form data
    if (item) {
      setFormData({
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
        itemGroup: item.itemGroup?._id || item.itemGroup || '',
        itemCategory: item.itemCategory?._id || item.itemCategory || '',
        inventoryUom: item.inventoryUom?._id || item.inventoryUom || '',
        purchaseUom: item.purchaseUom?._id || item.purchaseUom || '',
        salesUom: item.salesUom?._id || item.salesUom || '',
        itemPerPurchaseUnit: item.itemPerPurchaseUnit ?? 1,
        itemPerSalesUnit: item.itemPerSalesUnit ?? 1,
        hsnCode: item.hsnCode || '',
        reorderLevel: item.reorderLevel ?? 0,
        reorderQty: item.reorderQty ?? 0,
        minInventory: item.minInventory ?? 0,
        maxInventory: item.maxInventory ?? 0,
        leadTimeDays: item.leadTimeDays ?? 0,
        defaultBin: item.defaultBin?._id || item.defaultBin || '',
        description: item.description || '',
        itemType: item.itemType || 'standard',
        status: item.status || 'active',
      });

      // Load existing item specification values
      getItemSpecifications(item._id).then((specRes) => {
        if (specRes.success && Array.isArray(specRes.specifications)) {
          const map = {};
          specRes.specifications.forEach((s) => {
            const specId = s.specification?._id || s.specification;
            map[specId] = {
              value: s.value,
              isApply: s.isApply || false,
              isFix: s.isFix || false,
              printSerial: s.printSerial || 0,
              isExisting: true
            };
          });
          setSpecsData(map);
        }
      }).catch(console.error);

    } else {
      setFormData({
        itemCode: 'AUTO',
        itemName: '',
        itemGroup: '',
        itemCategory: '',
        inventoryUom: '',
        purchaseUom: '',
        salesUom: '',
        itemPerPurchaseUnit: 1,
        itemPerSalesUnit: 1,
        hsnCode: '',
        reorderLevel: 0,
        reorderQty: 0,
        minInventory: 0,
        maxInventory: 0,
        leadTimeDays: 0,
        defaultBin: '',
        description: '',
        itemType: 'standard',
        status: 'active',
      });
      setSpecsData({});
    }

    setActiveTab('basic');
    setErrorMessage('');
    setSuccessMessage('');
  }, [item, isOpen]);

  // Load category specifications when selected category changes
  useEffect(() => {
    if (!formData.itemCategory) {
      setCategorySpecs([]);
      return;
    }

    getCategorySpecifications(formData.itemCategory)
      .then((res) => {
        if (res.success && Array.isArray(res.specifications)) {
          // Preserve required and displayOrder from CategorySpecification wrapper
          const specs = res.specifications
            .map((cs) => {
              if (!cs.specification) return null;
              return {
                ...cs.specification,
                isRequiredCategorySpec: !!cs.required,
                categoryDisplayOrder: cs.displayOrder ?? 0,
              };
            })
            .filter(Boolean);

          // Sort by categoryDisplayOrder
          specs.sort((a, b) => a.categoryDisplayOrder - b.categoryDisplayOrder);
          setCategorySpecs(specs);
        }
      })
      .catch((err) => {
        console.error("Failed to load Category Specifications:", err);
      });
  }, [formData.itemCategory]);

  if (!isOpen) return null;

  // Filtered categories belonging to selected Item Group
  const availableCategories = itemCategories.filter((cat) => {
    if (!formData.itemGroup) return true;
    const catGroupId = cat.itemGroup?._id || cat.itemGroup;
    return catGroupId === formData.itemGroup;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === 'itemCode' ? value.toUpperCase() : value,
      };

      // Reset category if selected group changes and category is no longer valid
      if (name === 'itemGroup') {
        const validCat = itemCategories.find(
          (c) => (c.itemGroup?._id || c.itemGroup) === value && c._id === prev.itemCategory
        );
        if (!validCat) {
          next.itemCategory = '';
        }
      }

      // Auto-set purchase and sales UOM when inventory UOM is picked first time
      if (name === 'inventoryUom') {
        if (!prev.purchaseUom) next.purchaseUom = value;
        if (!prev.salesUom) next.salesUom = value;
      }

      return next;
    });
  };

  const handleSpecChange = (specId, field, value) => {
    setSpecsData((prev) => ({
      ...prev,
      [specId]: {
        ...prev[specId],
        [field]: value,
      },
    }));
  };

  const validate = () => {
    if (!formData.itemName.trim()) {
      return 'Item Name is required.';
    }
    if (!formData.itemGroup) {
      return 'Item Group is required.';
    }
    if (!formData.itemCategory) {
      return 'Item Category is required.';
    }
    if (!formData.inventoryUom) {
      return 'Inventory UOM is required.';
    }
    if (Number(formData.itemPerPurchaseUnit) <= 0) {
      return 'Item per purchase unit must be greater than 0.';
    }
    if (Number(formData.itemPerSalesUnit) <= 0) {
      return 'Item per sales unit must be greater than 0.';
    }

    // Validate required category specifications
    for (const spec of categorySpecs) {
      if (spec.isRequiredCategorySpec) {
        const val = specsData[spec._id]?.value;
        if (val === undefined || val === null || val === '') {
          return `Specification '${spec.specificationName}' is required for this item category.`;
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valError = validate();
    if (valError) {
      setErrorMessage(valError);
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let savedItem;
      if (isEditMode) {
        const res = await updateItem(item._id, formData);
        if (res.success) {
          savedItem = res.item;
        }
      } else {
        const res = await createItem(formData);
        if (res.success) {
          savedItem = res.item;
        }
      }

      // Save specification values for the item
      if (savedItem && savedItem._id) {
        for (const [specId, specVal] of Object.entries(specsData)) {
          if (specVal.value !== undefined && specVal.value !== null && specVal.value !== '') {
            try {
              if (specVal.isExisting) {
                await updateItemSpecification(savedItem._id, specId, {
                  value: specVal.value,
                  isApply: !!specVal.isApply,
                  isFix: !!specVal.isFix,
                  printSerial: Number(specVal.printSerial || 0),
                });
              } else {
                await assignItemSpecification(savedItem._id, {
                  specificationId: specId,
                  value: specVal.value,
                  isApply: !!specVal.isApply,
                  isFix: !!specVal.isFix,
                  printSerial: Number(specVal.printSerial || 0),
                });
              }
            } catch (specErr) {
              console.error(`Error saving spec ${specId}:`, specErr);
            }
          }
        }
      }

      setSuccessMessage(isEditMode ? 'Item updated successfully!' : 'Item created successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);

    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Failed to save Item record.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Item (${formData.itemCode})` : 'Add New Item'}
      maxWidth="720px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Item' : 'Create Item'}
          </Button>
        </>
      }
    >
      <div className="mb-4 border-b border-slate-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'basic' ? 'border-blue-700 text-blue-700 font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('uom')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'uom' ? 'border-blue-700 text-blue-700 font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            2. UOM & Units
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'inventory' ? 'border-blue-700 text-blue-700 font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Inventory Controls
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specifications')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'specifications' ? 'border-blue-700 text-blue-700 font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Specifications {categorySpecs.length > 0 && `(${categorySpecs.length})`}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {errorMessage && (
          <div className="col-span-full">
            <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
          </div>
        )}

        {successMessage && (
          <div className="col-span-full">
            <Alert type="success" message={successMessage} />
          </div>
        )}

        {/* TAB 1: BASIC INFO */}
        {activeTab === 'basic' && (
          <>
            <FormField label="Item Code" required helperText="Enter code or leave 'AUTO' for auto-generated code.">
              <Input
                name="itemCode"
                placeholder="AUTO"
                value={formData.itemCode}
                onChange={handleChange}
                disabled={submitting || isEditMode}
              />
            </FormField>

            <FormField label="Item Name" required helperText="Full descriptive name of the item.">
              <Input
                name="itemName"
                placeholder="e.g. Synthetic Pocket Filter G4"
                value={formData.itemName}
                onChange={handleChange}
                disabled={submitting}
                autoFocus
              />
            </FormField>

            <FormField label="Item Group" required helperText="Select top-level classification group.">
              <Select
                name="itemGroup"
                value={formData.itemGroup}
                onChange={handleChange}
                disabled={submitting || loadingData}
              >
                <option value="">-- Select Item Group --</option>
                {itemGroups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.groupCode} — {g.groupName}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Item Category" required helperText="Select category belonging to the chosen group.">
              <Select
                name="itemCategory"
                value={formData.itemCategory}
                onChange={handleChange}
                disabled={submitting || loadingData || !formData.itemGroup}
              >
                <option value="">-- Select Item Category --</option>
                {availableCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.categoryCode} — {c.categoryName}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Item Type">
              <Select
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="standard">Standard Item</option>
                <option value="raw_material">Raw Material</option>
                <option value="finished_goods">Finished Goods</option>
                <option value="component">Component / Sub-Assembly</option>
              </Select>
            </FormField>

            <FormField label="Status" required>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>

            <FormField label="Item Description" fullWidth helperText="Additional specifications or usage notes.">
              <Input
                name="description"
                placeholder="e.g. Standard air filter media roll"
                value={formData.description}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>
          </>
        )}

        {/* TAB 2: UOM & UNITS */}
        {activeTab === 'uom' && (
          <>
            <FormField label="Inventory UOM" required helperText="Base unit used for stock counting & valuation.">
              <Select
                name="inventoryUom"
                value={formData.inventoryUom}
                onChange={handleChange}
                disabled={submitting || loadingData}
              >
                <option value="">-- Select Inventory UOM --</option>
                {uoms.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.uomCode} — {u.uomName} ({u.dimension})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Purchase UOM" helperText="Unit used on Purchase Orders (defaults to Inventory UOM).">
              <Select
                name="purchaseUom"
                value={formData.purchaseUom}
                onChange={handleChange}
                disabled={submitting || loadingData}
              >
                <option value="">-- Defaults to Inventory UOM --</option>
                {uoms.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.uomCode} — {u.uomName} ({u.dimension})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Item Per Purchase Unit" helperText="How many Inventory UOMs in 1 Purchase UOM?">
              <Input
                type="number"
                step="any"
                name="itemPerPurchaseUnit"
                value={formData.itemPerPurchaseUnit}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Sales UOM" helperText="Unit used on Sales Orders & Invoices.">
              <Select
                name="salesUom"
                value={formData.salesUom}
                onChange={handleChange}
                disabled={submitting || loadingData}
              >
                <option value="">-- Defaults to Inventory UOM --</option>
                {uoms.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.uomCode} — {u.uomName} ({u.dimension})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Item Per Sales Unit" helperText="How many Inventory UOMs in 1 Sales UOM?">
              <Input
                type="number"
                step="any"
                name="itemPerSalesUnit"
                value={formData.itemPerSalesUnit}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>
          </>
        )}

        {/* TAB 3: INVENTORY CONTROLS */}
        {activeTab === 'inventory' && (
          <>
            <FormField label="HSN / SAC Code" helperText="Harmonized System Nomenclature code for taxation.">
              <Input
                name="hsnCode"
                placeholder="e.g. 84213990"
                value={formData.hsnCode}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Default Storage Bin" helperText="Preferred bin for inventory receipts.">
              <Select
                name="defaultBin"
                value={formData.defaultBin}
                onChange={handleChange}
                disabled={submitting || loadingData}
              >
                <option value="">-- None / Select Bin --</option>
                {bins.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.binCode} — {b.binName}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Reorder Level" helperText="Minimum stock threshold triggering reorder.">
              <Input
                type="number"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Reorder Quantity" helperText="Standard reorder quantity.">
              <Input
                type="number"
                name="reorderQty"
                value={formData.reorderQty}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Min Inventory" helperText="Safety stock minimum level.">
              <Input
                type="number"
                name="minInventory"
                value={formData.minInventory}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Max Inventory" helperText="Maximum allowed stock level.">
              <Input
                type="number"
                name="maxInventory"
                value={formData.maxInventory}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Lead Time (Days)" helperText="Procurement / manufacturing lead time in days.">
              <Input
                type="number"
                name="leadTimeDays"
                value={formData.leadTimeDays}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>
          </>
        )}

        {/* TAB 4: SPECIFICATIONS */}
        {activeTab === 'specifications' && (
          <div className="col-span-full">
            {!formData.itemCategory ? (
              <Alert type="info" message="Please select an Item Category in the 'Basic Info' tab to configure category specifications." />
            ) : categorySpecs.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 rounded-md border border-slate-200">
                No specification parameters are configured for the selected Item Category.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="text-xs text-slate-600 mb-1">
                  Category Specifications for selected category ({categorySpecs.length} parameters):
                </div>

                {categorySpecs.map((spec) => {
                  const specId = spec._id;
                  const currentData = specsData[specId] || { value: '', isApply: false, isFix: false, printSerial: 0 };

                  return (
                    <div
                      key={specId}
                      className="grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_70px_70px_70px] gap-2.5 items-center bg-white p-2.5 rounded-md border border-slate-200"
                    >
                      <div>
                        <strong className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1">
                          {spec.specificationName}
                          {spec.isRequiredCategorySpec && <span className="text-red-600 font-bold">*</span>}
                        </strong>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                          <span>{spec.specificationCode} ({spec.dataType})</span>
                          {spec.unit && (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10.5px] font-semibold">
                              {spec.unit?.uomCode || spec.unit?.uomName || spec.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Specification Value Input based on dataType */}
                      <div>
                        {spec.dataType === 'select' && Array.isArray(spec.options) ? (
                          <Select
                            value={currentData.value || ''}
                            onChange={(e) => handleSpecChange(specId, 'value', e.target.value)}
                            disabled={submitting}
                          >
                            <option value="">-- Select Option --</option>
                            {spec.options.map((opt, idx) => (
                              <option key={idx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </Select>
                        ) : spec.dataType === 'number' ? (
                          <Input
                            type="number"
                            placeholder="Enter number"
                            value={currentData.value || ''}
                            onChange={(e) => handleSpecChange(specId, 'value', e.target.value)}
                            disabled={submitting}
                          />
                        ) : spec.dataType === 'boolean' ? (
                          <Select
                            value={String(currentData.value ?? '')}
                            onChange={(e) => handleSpecChange(specId, 'value', e.target.value === 'true')}
                            disabled={submitting}
                          >
                            <option value="">-- Select --</option>
                            <option value="true">True / Yes</option>
                            <option value="false">False / No</option>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Enter text value"
                            value={currentData.value || ''}
                            onChange={(e) => handleSpecChange(specId, 'value', e.target.value)}
                            disabled={submitting}
                          />
                        )}
                      </div>

                      {/* isApply Checkbox */}
                      <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!currentData.isApply}
                          onChange={(e) => handleSpecChange(specId, 'isApply', e.target.checked)}
                          disabled={submitting}
                          className="accent-blue-600 cursor-pointer"
                        />
                        <span>Apply</span>
                      </label>

                      {/* isFix Checkbox */}
                      <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!currentData.isFix}
                          onChange={(e) => handleSpecChange(specId, 'isFix', e.target.checked)}
                          disabled={submitting}
                          className="accent-blue-600 cursor-pointer"
                        />
                        <span>Fix</span>
                      </label>

                      {/* printSerial Input */}
                      <div>
                        <Input
                          type="number"
                          placeholder="Order"
                          value={currentData.printSerial ?? 0}
                          onChange={(e) => handleSpecChange(specId, 'printSerial', e.target.value)}
                          disabled={submitting}
                          title="Print Serial Display Order"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default ItemFormModal;
