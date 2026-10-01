import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { createStore, updateStore } from '../../services/storeService';
import { Package } from 'lucide-react';

const StoreFormModal = ({ store, isOpen, onClose, onSuccess }) => {
  const isEdit = !!store;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    storeCode: '',
    storeName: '',
    address: '',
    contactPerson: '',
    contactNumber: '',
    email: '',
    status: 'ACTIVE',
    remarks: '',
  });

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (store) {
        setFormData({
          storeCode: store.storeCode || '',
          storeName: store.storeName || '',
          address: store.address || '',
          contactPerson: store.contactPerson || '',
          contactNumber: store.contactNumber || '',
          email: store.email || '',
          status: store.status || 'ACTIVE',
          remarks: store.remarks || '',
        });
      } else {
        setFormData({
          storeCode: '',
          storeName: '',
          address: '',
          contactPerson: '',
          contactNumber: '',
          email: '',
          status: 'ACTIVE',
          remarks: '',
        });
      }
    }
  }, [isOpen, store]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        await updateStore(store._id, formData);
      } else {
        await createStore(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Store form error:', err);
      setError(err.response?.data?.message || 'Failed to save store record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Store' : 'Create New Store'}
      size="lg"
      icon={Package}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Store'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="form-grid">
        {error && (
          <div style={{ gridColumn: '1 / -1' }} className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <FormField label="Store Code" required fullWidth>
          <Input
            name="storeCode"
            value={formData.storeCode}
            onChange={handleChange}
            placeholder="e.g. ST-01"
            autoFocus
            disabled={isEdit}
          />
        </FormField>
        
        <FormField label="Store Name" required fullWidth>
          <Input
            name="storeName"
            value={formData.storeName}
            onChange={handleChange}
            placeholder="e.g. Central Warehouse"
          />
        </FormField>

        <div style={{ gridColumn: '1 / -1' }}>
          <FormField label="Address" required fullWidth>
            <Textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full physical address"
              rows={3}
            />
          </FormField>
        </div>

        <FormField label="Contact Person" fullWidth>
          <Input
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            placeholder="e.g. Store Manager Name"
          />
        </FormField>

        <FormField label="Contact Number" fullWidth>
          <Input
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            placeholder="Contact phone number"
          />
        </FormField>

        <FormField label="Email Address" fullWidth>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Store contact email"
          />
        </FormField>

        <FormField label="Status" required fullWidth>
          <Select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </FormField>

        <div style={{ gridColumn: '1 / -1' }}>
          <FormField label="Remarks" fullWidth>
            <Input
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="Additional notes"
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
};

export default StoreFormModal;
