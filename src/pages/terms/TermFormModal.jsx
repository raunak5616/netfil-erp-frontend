import React, { useState, useEffect } from 'react';
import { useCreateTermMutation, useUpdateTermMutation } from '../../features/masterData/masterDataApi';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { Truck, CreditCard, Info } from 'lucide-react';

const TermFormModal = ({
  term,
  defaultTermType = 'DELIVERY',
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!term;
  const currentType = isEdit ? term.termType : defaultTermType;
  const isDelivery = currentType === 'DELIVERY';

  const [createTermMutation] = useCreateTermMutation();
  const [updateTermMutation] = useUpdateTermMutation();

  const [formData, setFormData] = useState({
    termName: '',
    description: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (term) {
      setFormData({
        termName: term.termName || '',
        description: term.description || '',
        isActive: term.isActive !== undefined ? term.isActive : term.status === 'active',
      });
    } else {
      setFormData({
        termName: '',
        description: '',
        isActive: true,
      });
    }
    setError('');
  }, [term, defaultTermType, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termName.trim()) {
      setError('Term name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        termType: currentType,
        termName: formData.termName.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
        status: formData.isActive ? 'active' : 'inactive',
      };

      if (isEdit) {
        await updateTermMutation({ id: term._id, ...payload }).unwrap();
      } else {
        await createTermMutation(payload).unwrap();
      }

      onSuccess(
        `${isDelivery ? 'Delivery' : 'Payment'} term "${formData.termName.trim()}" ${
          isEdit ? 'updated' : 'created'
        } successfully.`
      );
      onClose();
    } catch (err) {
      console.error('Error saving term:', err);
      setError(
        err?.data?.message ||
          err?.message ||
          `Failed to ${isEdit ? 'update' : 'create'} term.`
      );
    } finally {
      setLoading(false);
    }
  };

  const titleText = isEdit
    ? `Edit ${isDelivery ? 'Delivery' : 'Payment'} Term`
    : `Add ${isDelivery ? 'Delivery' : 'Payment'} Term`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleText}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Term'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        {/* Visual Pill Indicator for Active Term Type */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700">
          <div
            className={`p-1.5 rounded-lg ${
              isDelivery
                ? 'bg-blue-100 text-blue-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {isDelivery ? <Truck size={16} /> : <CreditCard size={16} />}
          </div>
          <div className="flex-1">
            <span className="font-semibold text-slate-900">
              {isDelivery ? 'Delivery Term' : 'Payment Term'}
            </span>
            <p className="text-[11px] text-slate-500">
              This record will be saved under the unified{' '}
              <code className="text-slate-800 font-medium">terms</code> collection with{' '}
              <span className="font-semibold">{currentType}</span> type.
            </p>
          </div>
        </div>

        {/* Term Name */}
        <FormField
          label={`${isDelivery ? 'Delivery' : 'Payment'} Term Name`}
          required
          helperText={`e.g. ${
            isDelivery
              ? 'Ex-Works, Door Delivery, FOB Mumbai, CIF, FOR Site'
              : '100% Advance, 30 Days Net, 50% Advance & 50% Against Dispatch'
          }`}
        >
          <Input
            name="termName"
            value={formData.termName}
            onChange={handleChange}
            placeholder={`Enter ${isDelivery ? 'delivery' : 'payment'} term name...`}
            autoFocus
            required
          />
        </FormField>

        {/* Description */}
        <FormField
          label="Description / Terms Clause"
          helperText="Detailed specification or contractual clause to print on documents."
        >
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
            placeholder="Enter clause or detailed description (optional)..."
          />
        </FormField>

        {/* Status */}
        <FormField label="Status">
          <Select
            name="isActive"
            value={formData.isActive ? 'true' : 'false'}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isActive: e.target.value === 'true',
              }))
            }
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </FormField>
      </form>
    </Modal>
  );
};

export default TermFormModal;
