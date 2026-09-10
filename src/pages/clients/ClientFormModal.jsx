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
      return 'Client Code is required.';
    }
    if (!formData.companyName.trim()) {
      return 'Company Name is required.';
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
          setSuccessMessage('Client record updated successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        const res = await createClient(formData);
        if (res.success) {
          setSuccessMessage('Client record created successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Failed to save client record.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Client (${formData.clientCode})` : 'Add New Client Master'}
      maxWidth="620px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Client' : 'Create Client'}
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

        {/* Client Code Input */}
        <FormField label="Client Code" required helperText="Unique client code (e.g. CLI-ACME, CLI-TATA)">
          <Input
            name="clientCode"
            placeholder="e.g. CLI-ACME"
            value={formData.clientCode}
            onChange={handleChange}
            disabled={submitting}
            autoFocus
          />
        </FormField>

        {/* Company Name Input */}
        <FormField label="Company Name" required helperText="Registered commercial business name">
          <Input
            name="companyName"
            placeholder="e.g. ACME Industries Pvt Ltd"
            value={formData.companyName}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        {/* Contact Person Input */}
        <FormField label="Contact Person" helperText="Primary representative name">
          <Input
            name="contactPerson"
            placeholder="e.g. Rajesh Sharma"
            value={formData.contactPerson}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        {/* Mobile Input */}
        <FormField label="Mobile Number" helperText="10-digit primary mobile contact">
          <Input
            name="mobile"
            placeholder="e.g. 9876543210"
            value={formData.mobile}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        {/* Email Input */}
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

        {/* Status Select */}
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

        {/* Street Address Input (Full width) */}
        <div style={{ gridColumn: 'span 2' }}>
          <FormField label="Address" fullWidth helperText="Registered Office or Works plant address">
            <Input
              name="address"
              placeholder="e.g. Plot No. 45, GIDC Industrial Estate"
              value={formData.address}
              onChange={handleChange}
              disabled={submitting}
            />
          </FormField>
        </div>

        {/* City Input */}
        <FormField label="City">
          <Input
            name="city"
            placeholder="e.g. Vadodara"
            value={formData.city}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        {/* State Input */}
        <FormField label="State">
          <Input
            name="state"
            placeholder="e.g. Gujarat"
            value={formData.state}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        {/* Pincode Input */}
        <FormField label="Pincode / Zip Code">
          <Input
            name="pincode"
            placeholder="e.g. 390010"
            value={formData.pincode}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default ClientFormModal;
