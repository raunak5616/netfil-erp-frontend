import React, { useState, useEffect } from 'react';
import { createUOM, updateUOM } from '../../services/uomService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';

const UOMFormModal = ({ uom, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!uom;

  const [formData, setFormData] = useState({
    uomCode: '',
    uomName: '',
    dimension: 'COUNT',
    description: '',
    status: 'active',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (uom) {
      setFormData({
        uomCode: uom.uomCode || '',
        uomName: uom.uomName || '',
        dimension: uom.dimension || 'COUNT',
        description: uom.description || '',
        status: uom.status || 'active',
      });
    } else {
      setFormData({
        uomCode: '',
        uomName: '',
        dimension: 'COUNT',
        description: '',
        status: 'active',
      });
    }
    setErrorMessage('');
    setSuccessMessage('');
  }, [uom, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'uomCode' ? value.toUpperCase() : value,
    }));
  };

  const validate = () => {
    if (!formData.uomCode.trim()) {
      return 'UOM Code is required.';
    }
    if (!formData.uomName.trim()) {
      return 'UOM Name is required.';
    }
    if (!['COUNT', 'WEIGHT', 'VOLUME', 'LENGTH'].includes(formData.dimension)) {
      return 'Dimension must be COUNT, WEIGHT, VOLUME, or LENGTH.';
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
        const res = await updateUOM(uom._id, formData);
        if (res.success) {
          setSuccessMessage('UOM record updated successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        const res = await createUOM(formData);
        if (res.success) {
          setSuccessMessage('UOM record created successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Failed to save UOM record.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit UOM (${formData.uomCode})` : 'Add New Unit of Measure (UOM)'}
      maxWidth="500px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update UOM' : 'Create UOM'}
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

        {/* UOM Code Input */}
        <FormField label="UOM Code" required fullWidth helperText="Unique code symbol (e.g. KG, NOS, M, L, IN)">
          <Input
            name="uomCode"
            placeholder="e.g. KG"
            value={formData.uomCode}
            onChange={handleChange}
            disabled={submitting}
            autoFocus
          />
        </FormField>

        {/* UOM Name Input */}
        <FormField label="UOM Name" required fullWidth helperText="Full descriptive name (e.g. Kilogram, Numbers)">
          <Input
            name="uomName"
            placeholder="e.g. Kilogram"
            value={formData.uomName}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        {/* Dimension Select */}
        <FormField label="Dimension" required fullWidth helperText="Physical dimension classification">
          <Select
            name="dimension"
            value={formData.dimension}
            onChange={handleChange}
            disabled={submitting}
          >
            <option value="COUNT">COUNT (Quantity / Pieces)</option>
            <option value="WEIGHT">WEIGHT (Mass / Load)</option>
            <option value="VOLUME">VOLUME (Capacity / Liquid)</option>
            <option value="LENGTH">LENGTH (Distance / Linear)</option>
          </Select>
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
        <FormField label="Description" fullWidth helperText="Optional usage notes or specification details">
          <Input
            name="description"
            placeholder="e.g. Metric standard kilogram unit"
            value={formData.description}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default UOMFormModal;
