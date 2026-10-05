import React, { useState, useEffect } from 'react';
import { createFilterGrade, updateFilterGrade } from '../../services/filterGradeService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { Layers, Plus, Trash2 } from 'lucide-react';

const FilterGradeForm = ({ gradeData, isOpen, onClose, onSuccess }) => {
  const isEdit = !!gradeData;

  const initialVariant = {
    filterClass: '',
    filterType: '',
    mountingType: '',
    temperature: '',
    media: '',
    efficiency: '',
    initialPressureDrop: '',
    finalPressureDrop: ''
  };

  const [formData, setFormData] = useState({
    filterGrade: '',
    eurovent: '',
    iso: '',
    status: 'active',
    remarks: '',
    variants: [{ ...initialVariant }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (gradeData && isOpen) {
      setFormData({
        filterGrade: gradeData.filterGrade || '',
        eurovent: gradeData.eurovent || '',
        iso: gradeData.iso || '',
        status: gradeData.status || 'active',
        remarks: gradeData.remarks || '',
        variants: gradeData.variants && gradeData.variants.length > 0 
          ? JSON.parse(JSON.stringify(gradeData.variants)) 
          : [{ ...initialVariant }]
      });
    } else if (isOpen) {
      setFormData({
        filterGrade: '',
        eurovent: '',
        iso: '',
        status: 'active',
        remarks: '',
        variants: [{ ...initialVariant }]
      });
    }
    setError('');
  }, [gradeData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { ...initialVariant }]
    }));
  };

  const removeVariant = (index) => {
    if (formData.variants.length <= 1) return;
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const validate = () => {
    if (!formData.filterGrade.trim()) return "Filter Grade is required.";
    if (formData.variants.length === 0) return "At least one technical variant is required.";
    
    // Check if at least one field is filled in variants to not send completely empty variants
    for (let i = 0; i < formData.variants.length; i++) {
      const v = formData.variants[i];
      const hasValue = Object.values(v).some(val => (val || '').trim() !== '');
      if (!hasValue) {
        return `Variant #${i + 1} is completely empty.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valError = validate();
    if (valError) {
      setError(valError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        await updateFilterGrade(gradeData._id, formData);
      } else {
        await createFilterGrade(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Filter Grade');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Filter Grade - ${gradeData.filterGrade}` : 'Add New Filter Grade'}
      size="xl"
      icon={Layers}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Filter Grade'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        {/* Master Fields */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Master Information</h4>
          <div className="form-grid">
            <FormField label="Filter Grade" required fullWidth helperText="E.g. Grade 6, Grade 13">
              <Input
                name="filterGrade"
                value={formData.filterGrade}
                onChange={handleChange}
                placeholder="e.g. Grade 13"
                autoFocus
              />
            </FormField>
            <FormField label="EUROVENT Standard" fullWidth>
              <Input
                name="eurovent"
                value={formData.eurovent}
                onChange={handleChange}
                placeholder="e.g. EU-13"
              />
            </FormField>
            <FormField label="ISO Standard" fullWidth>
              <Input
                name="iso"
                value={formData.iso}
                onChange={handleChange}
                placeholder="e.g. H-13"
              />
            </FormField>
            <FormField label="Status" required fullWidth>
              <Select name="status" value={formData.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="Remarks" fullWidth>
                <Textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Internal notes (optional)"
                  rows={2}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Variants Fields */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Technical Variants</h4>
            <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={addVariant}>
              Add Variant Row
            </Button>
          </div>
          
          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <div key={index} className="bg-slate-50 border border-slate-200 rounded-md p-4 relative">
                {formData.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="absolute -top-3 -right-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full p-1.5 shadow-sm transition-colors"
                    title="Remove Variant"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField label="Filter Class" fullWidth>
                    <Input
                      value={variant.filterClass}
                      onChange={(e) => handleVariantChange(index, 'filterClass', e.target.value)}
                      placeholder="e.g. Fine, Absolute, HEPA"
                    />
                  </FormField>
                  <FormField label="Construction / Type" fullWidth>
                    <Input
                      value={variant.mountingType || variant.filterType}
                      onChange={(e) => {
                        handleVariantChange(index, 'mountingType', e.target.value);
                        handleVariantChange(index, 'filterType', e.target.value);
                      }}
                      placeholder="e.g. Flange or Box"
                    />
                  </FormField>
                  <FormField label="Temperature (°C)" fullWidth>
                    <Input
                      value={variant.temperature}
                      onChange={(e) => handleVariantChange(index, 'temperature', e.target.value)}
                      placeholder="e.g. 50-500"
                    />
                  </FormField>
                  <FormField label="Media" fullWidth>
                    <Input
                      value={variant.media}
                      onChange={(e) => handleVariantChange(index, 'media', e.target.value)}
                      placeholder="e.g. Sub Micronic Fiber Glass"
                    />
                  </FormField>
                  <FormField label="Efficiency" fullWidth>
                    <Input
                      value={variant.efficiency}
                      onChange={(e) => handleVariantChange(index, 'efficiency', e.target.value)}
                      placeholder="e.g. 99.997% @ 0.3 micron"
                    />
                  </FormField>
                  <FormField label="Initial Pressure Drop" fullWidth>
                    <Input
                      value={variant.initialPressureDrop}
                      onChange={(e) => handleVariantChange(index, 'initialPressureDrop', e.target.value)}
                      placeholder="e.g. 25 mm Wc"
                    />
                  </FormField>
                  <FormField label="Final Pressure Drop" fullWidth>
                    <Input
                      value={variant.finalPressureDrop}
                      onChange={(e) => handleVariantChange(index, 'finalPressureDrop', e.target.value)}
                      placeholder="e.g. 70 mm Wc"
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default FilterGradeForm;
