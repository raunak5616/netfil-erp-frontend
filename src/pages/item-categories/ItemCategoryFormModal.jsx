import React, { useState, useEffect } from 'react';
import { createItemCategory, updateItemCategory } from '../../services/itemCategoryService';
import { getItemGroups } from '../../services/itemGroupService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';

const ItemCategoryFormModal = ({ category, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!category;

  const [formData, setFormData] = useState({
    categoryCode: '',
    categoryName: '',
    itemGroup: '',
    description: '',
    status: 'active',
  });

  const [itemGroups, setItemGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch available Item Groups for the dropdown
  useEffect(() => {
    if (isOpen) {
      const fetchGroups = async () => {
        setGroupsLoading(true);
        try {
          const res = await getItemGroups();
          if (res.success && Array.isArray(res.itemGroups)) {
            setItemGroups(res.itemGroups);
          }
        } catch (err) {
          console.error("Failed to fetch item groups:", err);
        } finally {
          setGroupsLoading(false);
        }
      };
      fetchGroups();
    }
  }, [isOpen]);

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
        const res = await updateItemCategory(category._id, formData);
        if (res.success) {
          setSuccessMessage('Item category updated successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        const res = await createItemCategory(formData);
        if (res.success) {
          setSuccessMessage('Item category created successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Failed to save item category.';
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

        {/* Parent Item Group Select */}
        <FormField label="Parent Item Group" required fullWidth helperText="Master group classification this category belongs to">
          <Select
            name="itemGroup"
            value={formData.itemGroup}
            onChange={handleChange}
            disabled={submitting || groupsLoading}
          >
            <option value="">-- Select Item Group --</option>
            {itemGroups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.groupCode} — {g.groupName} {g.status === 'inactive' ? '(Inactive)' : ''}
              </option>
            ))}
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
