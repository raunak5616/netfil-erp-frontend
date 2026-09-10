import React, { useState, useEffect } from 'react';
import { createClient, updateClient } from '../../services/clientService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';

const ClientFormModal = ({ client, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!client;

  const [formData, setFormData] = useState({
    clientCode: '',
    companyName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    status: 'active',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({
        clientCode: client.clientCode || '',
        companyName: client.companyName || '',
        contactPerson: client.contactPerson || '',
        mobile: client.mobile || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        pincode: client.pincode || '',
        status: client.status || 'active',
      });
    } else {
      setFormData({
        clientCode: '',
        companyName: '',
        contactPerson: '',
        mobile: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        status: 'active',
      });
    }
    setErrorMessage('');
    setSuccessMessage('');
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'clientCode' ? value.toUpperCase() : value,
    }));
  };

  const validate = () => {
    if (!formData.clientCode.trim()) {
      return 'Party Code is required.';
    }
    if (!formData.companyName.trim()) {
      return 'Party Name / Company Name is required.';
    }
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        return 'Please enter a valid email address.';
      }
    }
    if (formData.mobile.trim()) {
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(formData.mobile.trim())) {
        return 'Mobile number must be a valid 10-digit number.';
      }
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
        const res = await updateClient(client._id, formData);
        if (res.success) {
          setSuccessMessage('Party record updated successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        const res = await createClient(formData);
        if (res.success) {
          setSuccessMessage('Party record created successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Failed to save party record.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Party Master (${formData.clientCode})` : 'Add New Party Master'}
      maxWidth="640px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Party' : 'Create Party'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMessage && (
          <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
        )}

        {successMessage && (
          <Alert type="success" message={successMessage} />
        )}

        {/* SECTION 1: PARTY IDENTIFICATION */}
        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '12px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '10px' }}>
            1. Party Identification
          </div>
          <div className="form-grid">
            <FormField label="Party Code" required helperText="Unique party code identifier (e.g. PRT-ACME)">
              <Input
                name="clientCode"
                placeholder="e.g. PRT-ACME"
                value={formData.clientCode}
                onChange={handleChange}
                disabled={submitting}
                autoFocus
              />
            </FormField>

            <FormField label="Party Name / Company" required helperText="Registered commercial business name">
              <Input
                name="companyName"
                placeholder="e.g. ACME Manufacturing Pvt Ltd"
                value={formData.companyName}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Status" required>
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
          </div>
        </div>

        {/* SECTION 2: CONTACT DETAILS */}
        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '12px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '10px' }}>
            2. Contact Information
          </div>
          <div className="form-grid">
            <FormField label="Contact Person" helperText="Primary representative name">
              <Input
                name="contactPerson"
                placeholder="e.g. Rajesh Sharma"
                value={formData.contactPerson}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Mobile Number" helperText="10-digit primary mobile contact">
              <Input
                name="mobile"
                placeholder="e.g. 9876543210"
                value={formData.mobile}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Email Address" helperText="Official communication email">
              <Input
                name="email"
                type="email"
                placeholder="e.g. contact@acme.com"
                value={formData.email}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>
          </div>
        </div>

        {/* SECTION 3: ADDRESS & LOCATION */}
        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '12px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '10px' }}>
            3. Address & Location
          </div>
          <div className="form-grid">
            <div style={{ gridColumn: 'span 2' }}>
              <FormField label="Street Address" fullWidth helperText="Registered Office or Works plant address">
                <Input
                  name="address"
                  placeholder="e.g. Plot No. 45, GIDC Industrial Estate"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </FormField>
            </div>

            <FormField label="City">
              <Input
                name="city"
                placeholder="e.g. Vadodara"
                value={formData.city}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="State">
              <Input
                name="state"
                placeholder="e.g. Gujarat"
                value={formData.state}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Pincode / Zip Code">
              <Input
                name="pincode"
                placeholder="e.g. 390010"
                value={formData.pincode}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ClientFormModal;
