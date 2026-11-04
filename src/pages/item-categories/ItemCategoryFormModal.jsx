import React, { useState, useEffect, useMemo } from 'react';
import {
  useCreateItemCategoryMutation,
  useUpdateItemCategoryMutation,
  useGetItemGroupsQuery,
} from '../../features/masterData/masterDataApi';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { Layers } from 'lucide-react';

const FIXED_CATEGORIES = [
  { code: 'RAW', name: 'Raw', desc: 'Raw material category' },
  { code: 'FILTER', name: 'Filter', desc: 'Filter product category' },
  { code: 'COIL', name: 'Coil', desc: 'Coil product category' },
  { code: 'AHU', name: 'AHU', desc: 'Air Handling Unit category' },
];

const ItemCategoryFormModal = ({ category, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!category;

  const [createItemCategoryMutation] = useCreateItemCategoryMutation();
  const [updateItemCategoryMutation] = useUpdateItemCategoryMutation();

  const { data: groupsRes, isLoading: loadingGroups } = useGetItemGroupsQuery(
    { typeFilter: 'MASTER', status: 'active' },
    { skip: !isOpen }
  );

  const itemGroups = useMemo(() => {
    const list = groupsRes?.itemGroups || groupsRes?.groups || [];
    return Array.isArray(list) ? list.filter((g) => g.status === 'active') : [];
  }, [groupsRes]);

  const [formData, setFormData] = useState({
    categoryCode: '',
    categoryName: '',
    itemGroup: '',
    description: '',
    status: 'active',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        categoryCode: category.categoryCode || '',
        categoryName: category.categoryName || '',
        itemGroup: category.itemGroup?._id || category.itemGroup || '',
        description: category.description || '',
        status: category.status || 'active',
      });
    } else {
      setFormData({
        categoryCode: '',
        categoryName: '',
        itemGroup: '',
        description: '',
        status: 'active',
      });
    }
    setErrorMessage('');
    setSuccessMessage('');
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'categoryCode' ? value.toUpperCase() : value,
    }));
  };

  const handleSelectPreset = (preset) => {
    const matchedGroup = itemGroups.find(
      (g) =>
        (g.groupName || '').toUpperCase() === preset.name.toUpperCase() ||
        (g.groupCode || '').toUpperCase() === preset.code.toUpperCase()
    );

    setFormData((prev) => ({
      ...prev,
      categoryCode: preset.code,
      categoryName: preset.name,
      itemGroup: matchedGroup?._id || prev.itemGroup,
      description: prev.description || preset.desc,
    }));
  };

  const validate = () => {
    if (!formData.categoryCode.trim()) {
      return 'Category Code is required.';
    }
    if (!formData.categoryName.trim()) {
      return 'Category Name is required.';
    }
    if (!formData.itemGroup) {
      return 'Please select an Item Group.';
    }
    if (!['active', 'inactive'].includes(formData.status)) {
      return 'Status must be active or inactive.';
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
      if (isEditMode) {
        await updateItemCategoryMutation({ id: category._id, ...formData }).unwrap();
        setSuccessMessage('Item category updated successfully!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 800);
      } else {
        await createItemCategoryMutation(formData).unwrap();
        setSuccessMessage('Item category created successfully!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 800);
      }
    } catch (err) {
      const apiMsg = err?.data?.message || err?.message || 'Failed to save item category.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Item Category (${formData.categoryCode})` : 'Add New Item Category'}
      maxWidth="520px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Category' : 'Create Category'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="form-grid">
        {errorMessage && (
          <div style={{ gridColumn: 'span 2' }}>
            <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
          </div>
        )}

        {successMessage && (
          <div style={{ gridColumn: 'span 2' }}>
            <Alert type="success" message={successMessage} />
          </div>
        )}

        {/* Quick select presets for predefined fixed categories */}
        {!isEditMode && (
          <div style={{ gridColumn: 'span 2' }} className="mb-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Layers size={14} className="text-blue-600" />
              <span>Predefined Fixed System Categories:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FIXED_CATEGORIES.map((preset) => {
                const isSelected = formData.categoryCode === preset.code;
                return (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
                      }`}
                  >
                    {preset.name} ({preset.code})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Item Group Select */}
        <FormField label="Item Group" required fullWidth helperText="Assign this category to an Item Group (Raw, Filter, Coil, AHU)">
          <Select
            name="itemGroup"
            value={formData.itemGroup}
            onChange={handleChange}
            disabled={submitting || loadingGroups}
          >
            <option value="">-- Select Item Group --</option>
            {itemGroups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.groupName} ({g.groupCode})
              </option>
            ))}
          </Select>
        </FormField>

        {/* Category Code Input */}
        <FormField label="Category Code" required fullWidth helperText="Unique code identifier (e.g. RAW, FILTER, COIL, AHU)">
          <Input
            name="categoryCode"
            placeholder="e.g. RAW"
            value={formData.categoryCode}
            onChange={handleChange}
            disabled={submitting}
            autoFocus
          />
        </FormField>

        {/* Category Name Input */}
        <FormField label="Category Name" required fullWidth helperText="Descriptive name (e.g. Raw, Filter, Coil, AHU)">
          <Input
            name="categoryName"
            placeholder="e.g. Raw"
            value={formData.categoryName}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        {/* Status Select */}
        <FormField label="Status" required fullWidth>
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

        {/* Description Field */}
        <FormField label="Description" fullWidth helperText="Optional usage details or scope for this category">
          <Input
            name="description"
            placeholder="e.g. Standard manufacturing category"
            value={formData.description}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default ItemCategoryFormModal;
