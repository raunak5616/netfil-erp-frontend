import React, { useState, useEffect } from 'react';
import { createSpecification, updateSpecification } from '../../services/specificationService';
import { getUOMs } from '../../services/uomService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { Plus, X } from 'lucide-react';

const SpecificationFormModal = ({ specification, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!specification;

  const [formData, setFormData] = useState({
    specificationCode: '',
    specificationName: '',
    dataType: 'string',
    unit: '',
    options: [],
    description: '',
    status: 'active',
  });

  const [uoms, setUoms] = useState([]);
  const [uomsLoading, setUomsLoading] = useState(false);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch UOMs for the unit dropdown
  useEffect(() => {
    if (isOpen) {
      const fetchUnits = async () => {
        setUomsLoading(true);
        try {
          const res = await getUOMs();
          if (res.success && Array.isArray(res.uoms)) {
            setUoms(res.uoms);
          }
        } catch (err) {
          console.error("Failed to fetch UOMs:", err);
        } finally {
          setUomsLoading(false);
        }
      };
      fetchUnits();
    }
  }, [isOpen]);

  useEffect(() => {
    if (specification) {
      setFormData({
        specificationCode: specification.specificationCode || '',
        specificationName: specification.specificationName || '',
        dataType: specification.dataType || 'string',
        unit: specification.unit?._id || specification.unit || '',
        options: Array.isArray(specification.options) ? [...specification.options] : [],
        description: specification.description || '',
        status: specification.status || 'active',
      });
    } else {
      setFormData({
        specificationCode: '',
        specificationName: '',
        dataType: 'string',
        unit: '',
        options: [],
        description: '',
        status: 'active',
      });
    }
    setNewOptionInput('');
    setErrorMessage('');
    setSuccessMessage('');
  }, [specification, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'specificationCode' ? value.toUpperCase() : value,
    }));
  };

  const handleAddOption = () => {
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;

    if (formData.options.some((opt) => opt.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`Option "${trimmed}" is already added.`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, trimmed],
    }));
    setNewOptionInput('');
    setErrorMessage('');
  };

  const handleRemoveOption = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const validate = () => {
    if (!formData.specificationCode.trim()) {
      return 'Specification Code is required.';
    }
    if (!formData.specificationName.trim()) {
      return 'Specification Name is required.';
    }
    if (!['string', 'number', 'boolean', 'select'].includes(formData.dataType)) {
      return 'Data Type must be string, number, boolean, or select.';
    }
    if (formData.dataType === 'select' && formData.options.length === 0) {
      return 'Please add at least one option for select-type specification.';
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

    const payload = {
      ...formData,
      unit: formData.unit || null,
      options: formData.dataType === 'select' ? formData.options : [],
    };

    try {
      if (isEditMode) {
        const res = await updateSpecification(specification._id, payload);
        if (res.success) {
          setSuccessMessage('Specification updated successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        const res = await createSpecification(payload);
        if (res.success) {
          setSuccessMessage('Specification created successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Failed to save specification.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Specification (${formData.specificationCode})` : 'Add New Specification'}
      maxWidth="540px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Specification' : 'Create Specification'}
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

        {/* Specification Code Input */}
        <FormField label="Specification Code" required fullWidth helperText="Unique code identifier (e.g. SPEC-GRADE, SPEC-THK, SPEC-COLOR)">
          <Input
            name="specificationCode"
            placeholder="e.g. SPEC-GRADE"
            value={formData.specificationCode}
            onChange={handleChange}
            disabled={submitting}
            autoFocus
          />
        </FormField>

        {/* Specification Name Input */}
        <FormField label="Specification Name" required fullWidth helperText="Descriptive parameter name">
          <Input
            name="specificationName"
            placeholder="e.g. Steel Grade / Material Quality"
            value={formData.specificationName}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        {/* Data Type Select */}
        <FormField label="Data Type" required fullWidth helperText="Expected input type for this parameter">
          <Select
            name="dataType"
            value={formData.dataType}
            onChange={handleChange}
            disabled={submitting}
          >
            <option value="string">String / Text</option>
            <option value="number">Numeric Number</option>
            <option value="boolean">Boolean (Yes / No)</option>
            <option value="select">Select / Dropdown Choices</option>
          </Select>
        </FormField>

        {/* Unit of Measure Select (relevant for number or string) */}
        {(formData.dataType === 'number' || formData.dataType === 'string') && (
          <FormField label="Unit of Measure (UOM)" fullWidth helperText="Optional measurement unit for this parameter">
            <Select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              disabled={submitting || uomsLoading}
            >
              <option value="">-- None / Dimensionless --</option>
              {uoms.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.uomCode} ({u.uomName})
                </option>
              ))}
            </Select>
          </FormField>
        )}

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

        {/* Options Manager (When dataType === 'select') */}
        {formData.dataType === 'select' && (
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--neutral-50)', padding: '12px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-900)' }}>
              Select Options List <span style={{ color: 'var(--danger-500)' }}>*</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
              Add predefined choices for items to select from (e.g. 304, 316, 316L, 410)
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <Input
                placeholder="Enter option value and click Add..."
                value={newOptionInput}
                onChange={(e) => setNewOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
                disabled={submitting}
              />
              <Button
                type="button"
                variant="secondary"
                icon={Plus}
                onClick={handleAddOption}
                disabled={submitting || !newOptionInput.trim()}
              >
                Add
              </Button>
            </div>

            {/* List of current options */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {formData.options.length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--neutral-400)', italic: 'true' }}>
                  No options added yet. Type above and click Add.
                </span>
              ) : (
                formData.options.map((opt, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#ffffff',
                      color: 'var(--neutral-800)',
                      border: '1px solid var(--neutral-300)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      disabled={submitting}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: 'var(--neutral-500)',
                        padding: 0,
                      }}
                      title="Remove option"
                    >
                      <X size={13} color="var(--danger-600)" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {/* Description Field */}
        <FormField label="Description" fullWidth helperText="Optional usage details or engineering notes">
          <Input
            name="description"
            placeholder="e.g. Standard steel grade material specification"
            value={formData.description}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default SpecificationFormModal;
