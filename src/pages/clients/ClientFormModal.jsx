import React, { useState, useEffect } from 'react';
import { createClient, updateClient } from '../../services/clientService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { COUNTRIES } from '../../constants/countries';

const ClientFormModal = ({ client, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!client;

  const [formData, setFormData] = useState({
    clientCode: '',
    companyName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    country: 'India',
    address: '',
    addressLine2: '',
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
        country: client.country || 'India',
        address: client.address || '',
        addressLine2: client.addressLine2 || '',
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
        country: 'India',
        address: '',
        addressLine2: '',
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

  const isIndia = (formData.country || 'India').trim().toLowerCase() === 'india';

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
    if (!formData.country || !formData.country.trim()) {
      return 'Country is required.';
    }
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        return 'Please enter a valid email address.';
      }
    }
    if (formData.mobile && formData.mobile.trim()) {
      if (isIndia) {
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(formData.mobile.trim())) {
          return 'Mobile number must be a valid 10-digit number for India.';
        }
      } else {
        const intlMobilePattern = /^[+\d\s\-()]{6,20}$/;
        if (!intlMobilePattern.test(formData.mobile.trim())) {
          return 'International mobile number must be valid (6-20 digits and optional +, -, spaces).';
        }
      }
    }
    if (formData.pincode && formData.pincode.trim()) {
      if (isIndia) {
        const pinRegex = /^\d{6}$/;
        if (!pinRegex.test(formData.pincode.trim())) {
          return 'Pincode must be a valid 6-digit number for India.';
        }
      } else {
        if (formData.pincode.trim().length > 16) {
          return 'Postal code must not exceed 16 characters.';
        }
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

            <FormField label="Mobile Number" helperText={isIndia ? "10-digit primary mobile contact" : "International contact number (e.g. +1 555-0199)"}>
              <Input
                name="mobile"
                placeholder={isIndia ? "e.g. 9876543210" : "e.g. +1 555-123-4567"}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase' }}>
              3. Address & Location
            </div>
            {!isIndia && (
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: '10px' }}>
                International Address
              </span>
            )}
          </div>
          <div className="form-grid">
            <div style={{ gridColumn: 'span 2' }}>
              <FormField label="Country" required helperText="Select party country (searchable list, defaults to India)">
                <Select
                  name="country"
                  value={formData.country || 'India'}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <FormField
                label={isIndia ? "Street Address" : "Street Address / Address Line 1"}
                fullWidth
                helperText={isIndia ? "Registered Office or Works plant address" : "Primary street or facility address"}
              >
                <Input
                  name="address"
                  placeholder={isIndia ? "e.g. Plot No. 45, GIDC Industrial Estate" : "e.g. 100 Main Street, Suite 400"}
                  value={formData.address}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </FormField>
            </div>

            {!isIndia && (
              <div style={{ gridColumn: 'span 2' }}>
                <FormField
                  label="Address Line 2 (Optional)"
                  fullWidth
                  helperText="Apartment, suite, unit, building, floor, etc."
                >
                  <Input
                    name="addressLine2"
                    placeholder="e.g. Building B, Floor 3"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>
              </div>
            )}

            <FormField label={isIndia ? "City" : "City / Town"}>
              <Input
                name="city"
                placeholder={isIndia ? "e.g. Vadodara" : "e.g. New York, Dubai, London"}
                value={formData.city}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label={isIndia ? "State" : "State / Province / Region (Optional)"}>
              <Input
                name="state"
                placeholder={isIndia ? "e.g. Gujarat" : "e.g. California, Dubai, Ontario"}
                value={formData.state}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField
              label={isIndia ? "Pincode / Zip Code" : "Postal Code / ZIP Code (Optional)"}
              helperText={isIndia ? "6-digit PIN code" : "Postal code (optional where country does not use one)"}
            >
              <Input
                name="pincode"
                placeholder={isIndia ? "e.g. 390010" : "e.g. 90210, SW1A 1AA"}
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
