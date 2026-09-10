import React, { useState, useEffect } from 'react';
import { createItemGroup, updateItemGroup } from '../../services/itemGroupService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';

const ItemGroupFormModal = ({ itemGroup, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!itemGroup;

  const [formData, setFormData] = useState({
    groupCode: '',
    groupName: '',
    description: '',
    status: 'active',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (itemGroup) {
      setFormData({
        groupCode: itemGroup.groupCode || '',
        groupName: itemGroup.groupName || '',
        description: itemGroup.description || '',
        status: itemGroup.status || 'active',
      });
    } else {
      setFormData({
        groupCode: '',
        groupName: '',
        description: '',
        status: 'active',
      });
    }
    setErrorMessage('');
    setSuccessMessage('');
  }, [itemGroup, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'groupCode' ? value.toUpperCase() : value,
    }));
  };

  const validate = () => {
    if (!formData.groupCode.trim()) {
      return 'Group Code is required.';
    }
    if (!formData.groupName.trim()) {
      return 'Group Name is required.';
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
        const res = await updateItemGroup(itemGroup._id, formData);
        if (res.success) {
          setSuccessMessage('Item group updated successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        const res = await createItemGroup(formData);
        if (res.success) {
          setSuccessMessage('Item group created successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Failed to save item group.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Item Group (${formData.groupCode})` : 'Add New Item Group'}
      maxWidth="500px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Item Group' : 'Create Item Group'}
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

        {/* Group Code Input */}
        <FormField label="Group Code" required fullWidth helperText="Unique identifier code (e.g. GRP-RAW, GRP-FG, GRP-ELEC)">
          <Input
            name="groupCode"
            placeholder="e.g. GRP-RAW"
            value={formData.groupCode}
            onChange={handleChange}
            disabled={submitting}
            autoFocus
          />
        </FormField>

        {/* Group Name Input */}
        <FormField label="Group Name" required fullWidth helperText="Descriptive name for the item group">
          <Input
            name="groupName"
            placeholder="e.g. Raw Materials"
            value={formData.groupName}
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
        <FormField label="Description" fullWidth helperText="Optional details or scope for this group">
          <Input
            name="description"
            placeholder="e.g. All raw steel sheets, wires, and metallic stock"
            value={formData.description}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default ItemGroupFormModal;
