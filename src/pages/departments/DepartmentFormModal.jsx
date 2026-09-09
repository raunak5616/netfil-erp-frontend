import React, { useState, useEffect } from 'react';
import { createDepartment, updateDepartment } from '../../services/departmentService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';

const DepartmentFormModal = ({ department, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!department;

  const [formData, setFormData] = useState({
    departmentCode: '',
    departmentName: '',
    status: 'active',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (department) {
      setFormData({
        departmentCode: department.departmentCode || '',
        departmentName: department.departmentName || '',
        status: department.status || 'active',
      });
    } else {
      setFormData({
        departmentCode: '',
        departmentName: '',
        status: 'active',
      });
    }
    setErrorMessage('');
    setSuccessMessage('');
  }, [department, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'departmentCode' ? value.toUpperCase() : value,
    }));
  };

  const validate = () => {
    if (!formData.departmentCode.trim()) {
      return 'Department code is required.';
    }
    if (!formData.departmentName.trim()) {
      return 'Department name is required.';
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
        const res = await updateDepartment(department._id, formData);
        if (res.success) {
          setSuccessMessage('Department updated successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        const res = await createDepartment(formData);
        if (res.success) {
          setSuccessMessage('Department created successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Failed to save department.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Department (${formData.departmentCode})` : 'Add New Department'}
      maxWidth="480px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Department' : 'Create Department'}
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

        <FormField label="Department Code" required fullWidth helperText="Unique code identifier (e.g. ADM, PRD, FIN)">
          <Input
            name="departmentCode"
            placeholder="e.g. PRD"
            value={formData.departmentCode}
            onChange={handleChange}
            disabled={submitting}
            autoFocus
          />
        </FormField>

        <FormField label="Department Name" required fullWidth>
          <Input
            name="departmentName"
            placeholder="e.g. Production & Operations"
            value={formData.departmentName}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

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
      </form>
    </Modal>
  );
};

export default DepartmentFormModal;
