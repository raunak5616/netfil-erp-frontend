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

const ItemCategoryFormModal = ({ category, isOpen, onClose, onSuccess, initialItemGroups = [] }) => {
  const isEditMode = !!category;

  const [createItemCategoryMutation] = useCreateItemCategoryMutation();
  const [updateItemCategoryMutation] = useUpdateItemCategoryMutation();

  const {
    data: itemGroupsData,
    isLoading: groupsLoading,
    error: groupsQueryError,
  } = useGetItemGroupsQuery({ typeFilter: 'MASTER' }, { skip: !isOpen });

  const groupsError = groupsQueryError?.data?.message || '';

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

  const rawGroups = useMemo(() => {
    return (
      itemGroupsData?.itemGroups ||
      itemGroupsData?.groups ||
      (Array.isArray(itemGroupsData) ? itemGroupsData : initialItemGroups || [])
    );
  }, [itemGroupsData, initialItemGroups]);

  // Filter out system internal groups and guarantee currently edited category's item group is included
  const displayGroups = useMemo(() => {
    const list = [...rawGroups];

    // If editing a category and its group is an object not currently in list, inject it
    if (category?.itemGroup && typeof category.itemGroup === 'object' && category.itemGroup._id) {
      const exists = list.some((g) => String(g._id) === String(category.itemGroup._id));
      if (!exists) {
        list.push(category.itemGroup);
      }
    }

    return list.filter((g) => {
      if (g.groupType === 'SYSTEM') return false;
      const code = String(g.groupCode || '').toUpperCase();
      return !code.startsWith('GP-WO-') && code !== 'GP-INV' && code !== 'GP-OBOM';
    });
  }, [rawGroups, category]);

  useEffect(() => {
    if (category) {
      setFormData({
        categoryCode: category.categoryCode || '',
        categoryName: category.categoryName || '',
        itemGroup: category.itemGroup?._id
          ? String(category.itemGroup._id)
          : category.itemGroup
          ? String(category.itemGroup)
          : '',
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

  const validate = () => {
    if (!formData.categoryCode.trim()) {
      return 'Category Code is required.';
    }
    if (!formData.categoryName.trim()) {
      return 'Category Name is required.';
    }
    if (!formData.itemGroup) {
      return 'Item Group selection is required.';
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

        {groupsError && (
          <div style={{ gridColumn: 'span 2' }}>
            <Alert type="warning" message={groupsError} onClose={() => setGroupsError('')} />
          </div>
        )}

        {successMessage && (
          <div style={{ gridColumn: 'span 2' }}>
            <Alert type="success" message={successMessage} />
          </div>
        )}

        {/* Parent Item Group Select */}
        <FormField
          label="Parent Item Group"
          required
          fullWidth
          error={groupsError}
          helperText="Master group classification this category belongs to"
        >
          <Select
            name="itemGroup"
            value={formData.itemGroup}
            onChange={handleChange}
            disabled={submitting || groupsLoading}
          >
            <option value="">-- Select Item Group --</option>
            {groupsLoading && displayGroups.length === 0 ? (
              <option value="" disabled>Loading item groups...</option>
            ) : displayGroups.length === 0 ? (
              <option value="" disabled>No item groups available</option>
            ) : (
              displayGroups.map((g) => (
                <option key={g._id} value={g._id}>
                  {`${g.groupCode} — ${g.groupName}${g.status === 'inactive' ? ' (Inactive)' : ''}`}
                </option>
              ))
            )}
          </Select>
        </FormField>

        {/* Category Code Input */}
        <FormField label="Category Code" required fullWidth helperText="Unique code symbol (e.g. CAT-SHEET, CAT-PIPE, CAT-WIRE)">
          <Input
            name="categoryCode"
            placeholder="e.g. CAT-SHEET"
            value={formData.categoryCode}
            onChange={handleChange}
            disabled={submitting}
            autoFocus
          />
        </FormField>

        {/* Category Name Input */}
        <FormField label="Category Name" required fullWidth helperText="Descriptive name for the category">
          <Input
            name="categoryName"
            placeholder="e.g. Stainless Steel Sheets"
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
            placeholder="e.g. Cold-rolled and hot-rolled industrial steel plates"
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
