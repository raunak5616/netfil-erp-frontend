import React, { useState, useEffect, useMemo } from 'react';
import { createRequirement, updateRequirement } from '../../services/requirementService';
import { getClients } from '../../services/clientService';
import { getItems } from '../../services/itemService';
import { getItemCategories } from '../../services/itemCategoryService';
import { getUOMs } from '../../services/uomService';
import { getEmployees } from '../../services/employeeService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { Search, X, Plus, Trash2, Calendar, User, Package, Layers, Scale } from 'lucide-react';

const RequirementFormModal = ({ requirement, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!requirement;

  // Master options state
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(false);

  // Search states for searchable dropdown selectors
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  const [itemSearch, setItemSearch] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);

  const getFourDaysFromDate = (baseDateStr) => {
    try {
      const d = baseDateStr ? new Date(baseDateStr) : new Date();
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + 4);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Form input state
  const [formData, setFormData] = useState({
    client: '',
    requirementDate: new Date().toISOString().split('T')[0],
    type: 'product',
    serviceDescription: '',
    itemCategory: '',
    item: '',
    quantity: '',
    uom: '',
    dimensions: { length: '', width: '', height: '', unit: 'mm' },
    specifications: [],
    remarks: '',
    followUpDate: getFourDaysFromDate(),
    status: 'draft',
    salesPerson: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all reference master data
  useEffect(() => {
    if (!isOpen) return;

    const fetchMasterData = async () => {
      setLoadingMasters(true);
      try {
        const [cRes, iRes, catRes, uRes, eRes] = await Promise.all([
          getClients(),
          getItems(),
          getItemCategories(),
          getUOMs(),
          getEmployees(),
        ]);

        if (cRes.success && Array.isArray(cRes.clients)) {
          setClients(cRes.clients.filter((c) => c.status === 'active'));
        }
        if (iRes.success && Array.isArray(iRes.items)) {
          setItems(iRes.items.filter((i) => i.status === 'active'));
        }
        const categoriesArray = catRes.itemCategories || catRes.categories;
        if (catRes.success && Array.isArray(categoriesArray)) {
          setItemCategories(categoriesArray.filter((cat) => cat.status === 'active'));
        }
        if (uRes.success && Array.isArray(uRes.uoms)) {
          setUoms(uRes.uoms.filter((u) => u.status === 'active'));
        }
        if (eRes.success && Array.isArray(eRes.employees)) {
          setEmployees(eRes.employees.filter((e) => e.status === 'active'));
        }
      } catch (err) {
        console.error('Failed to load master references:', err);
        setErrorMessage('Failed to load master lookup options.');
      } finally {
        setLoadingMasters(false);
      }
    };

    fetchMasterData();
  }, [isOpen]);

  // Populate form data when editing or creating
  useEffect(() => {
    if (requirement) {
      const formattedReqDate = requirement.requirementDate
        ? new Date(requirement.requirementDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const formattedFollowDate = requirement.followUpDate
        ? new Date(requirement.followUpDate).toISOString().split('T')[0]
        : '';

      const specs = Array.isArray(requirement.specifications)
        ? requirement.specifications.map((s) =>
            typeof s === 'object' && s !== null
              ? { key: s.key || s.name || '', value: s.value || s.val || '' }
              : { key: 'Spec', value: String(s) }
          )
        : [];

      const dims = requirement.dimensions && typeof requirement.dimensions === 'object' && !Array.isArray(requirement.dimensions)
        ? {
            length: requirement.dimensions.length || '',
            width: requirement.dimensions.width || '',
            height: requirement.dimensions.height || '',
            unit: requirement.dimensions.unit || 'mm',
          }
        : { length: '', width: '', height: '', unit: 'mm' };

      setFormData({
        client: requirement.client?._id || requirement.client || '',
        requirementDate: formattedReqDate,
        type: requirement.type || 'product',
        serviceDescription: requirement.serviceDescription || '',
        itemCategory: requirement.itemCategory?._id || requirement.itemCategory || '',
        item: requirement.item?._id || requirement.item || '',
        quantity: requirement.quantity !== null && requirement.quantity !== undefined ? requirement.quantity : '',
        uom: requirement.uom?._id || requirement.uom || '',
        dimensions: dims,
        specifications: specs,
        remarks: requirement.remarks || '',
        followUpDate: formattedFollowDate,
        status: requirement.status || 'draft',
        salesPerson: requirement.salesPerson?._id || requirement.salesPerson || '',
      });

      // Set initial search labels for party and item
      if (requirement.client) {
        const partyObj = typeof requirement.client === 'object' ? requirement.client : null;
        if (partyObj) {
          setClientSearch(`${partyObj.clientCode ? partyObj.clientCode + ' - ' : ''}${partyObj.companyName}`);
        }
      } else {
        setClientSearch('');
      }

      if (requirement.item) {
        const itemObj = typeof requirement.item === 'object' ? requirement.item : null;
        if (itemObj) {
          setItemSearch(`${itemObj.itemCode ? itemObj.itemCode + ' - ' : ''}${itemObj.itemName}`);
        }
      } else {
        setItemSearch('');
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        client: '',
        requirementDate: today,
        type: 'product',
        serviceDescription: '',
        itemCategory: '',
        item: '',
        quantity: '',
        uom: '',
        dimensions: { length: '', width: '', height: '', unit: 'mm' },
        specifications: [],
        remarks: '',
        followUpDate: getFourDaysFromDate(today),
        status: 'draft',
        salesPerson: '',
      });
      setClientSearch('');
      setItemSearch('');
    }

    setErrorMessage('');
    setSuccessMessage('');
  }, [requirement, isOpen]);

  if (!isOpen) return null;

  // Filtered lists for searchable selectors
  const filteredClients = clients.filter((c) => {
    if (!clientSearch.trim()) return true;
    const term = clientSearch.toLowerCase();
    const code = (c.clientCode || '').toLowerCase();
    const name = (c.companyName || '').toLowerCase();
    return code.includes(term) || name.includes(term);
  });

  const filteredItems = items.filter((i) => {
    // If item category is selected, filter items belonging to that category
    if (formData.itemCategory) {
      const catId = typeof i.itemCategory === 'object' ? i.itemCategory?._id : i.itemCategory;
      if (catId && catId !== formData.itemCategory) return false;
    }
    if (!itemSearch.trim()) return true;
    const term = itemSearch.toLowerCase();
    const code = (i.itemCode || '').toLowerCase();
    const name = (i.itemName || '').toLowerCase();
    return code.includes(term) || name.includes(term);
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'requirementDate' && value && !isEditMode) {
        updated.followUpDate = getFourDaysFromDate(value);
      }
      return updated;
    });
  };

  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [name]: value,
      },
    }));
  };

  const addSpecificationRow = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const updateSpecificationRow = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.specifications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, specifications: updated };
    });
  };

  const removeSpecificationRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const selectParty = (party) => {
    setFormData((prev) => ({ ...prev, client: party._id }));
    setClientSearch(`${party.clientCode ? party.clientCode + ' - ' : ''}${party.companyName}`);
    setIsClientDropdownOpen(false);
  };

  const clearParty = () => {
    setFormData((prev) => ({ ...prev, client: '' }));
    setClientSearch('');
  };

  const selectItem = (item) => {
    const itemCatId = typeof item.itemCategory === 'object' ? item.itemCategory?._id : item.itemCategory;
    const itemUomId = typeof item.salesUom === 'object' ? item.salesUom?._id : (item.salesUom || item.inventoryUom);

    setFormData((prev) => ({
      ...prev,
      item: item._id,
      itemCategory: itemCatId || prev.itemCategory,
      uom: itemUomId || prev.uom,
    }));
    setItemSearch(`${item.itemCode ? item.itemCode + ' - ' : ''}${item.itemName}`);
    setIsItemDropdownOpen(false);
  };

  const clearItem = () => {
    setFormData((prev) => ({ ...prev, item: '' }));
    setItemSearch('');
  };

  const validate = () => {
    if (!formData.client) {
      return 'Please select a Party.';
    }
    if (!formData.requirementDate) {
      return 'Requirement Date is required.';
    }

    if (formData.type === 'product') {
      if (!formData.uom) {
        return 'UOM is required for product enquiries.';
      }
      if (!formData.quantity || Number(formData.quantity) <= 0) {
        return 'Quantity must be a valid number greater than 0.';
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valErr = validate();
    if (valErr) {
      setErrorMessage(valErr);
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Prepare payload exactly matching backend Requirement model expectations
    const payload = {
      client: formData.client,
      requirementDate: formData.requirementDate,
      type: formData.type,
      serviceDescription: formData.type === 'service' ? formData.serviceDescription : '',
      itemCategory: formData.itemCategory || null,
      item: formData.type === 'product' ? (formData.item || null) : null,
      quantity: formData.type === 'product' && formData.quantity ? Number(formData.quantity) : null,
      uom: formData.type === 'product' ? (formData.uom || null) : null,
      dimensions: formData.type === 'product' ? formData.dimensions : {},
      specifications: formData.specifications.filter((s) => s.key.trim() || s.value.trim()),
      remarks: formData.remarks,
      followUpDate: formData.followUpDate || null,
      status: formData.status,
      salesPerson: formData.salesPerson || null,
    };

    try {
      if (isEditMode) {
        const res = await updateRequirement(requirement._id, payload);
        if (res.success) {
          setSuccessMessage('Requirement updated successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        const res = await createRequirement(payload);
        if (res.success) {
          setSuccessMessage(`Requirement created successfully (${res.requirement?.requirementNo || ''})`);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      console.error('Save requirement error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to save Requirement record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Find currently selected Party object for preview
  const selectedPartyObj = clients.find((c) => c._id === formData.client);
  const selectedItemObj = items.find((i) => i._id === formData.item);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditMode
          ? `Edit Requirement / Enquiry (${requirement.requirementNo})`
          : 'New Customer Requirement / Enquiry'
      }
      maxWidth="760px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Requirement' : 'Create Requirement'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMessage && <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />}
        {successMessage && <Alert type="success" message={successMessage} />}

        {/* SECTION 1: PARTY & GENERAL INFORMATION */}
        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} /> 1. Party & Enquiry Identification
          </div>

          <div className="form-grid">
            {/* Searchable Party Selector */}
            <div style={{ gridColumn: 'span 2' }}>
              <FormField label="Select Party / Customer" required helperText="Search and select existing customer party record">
                <div style={{ position: 'relative' }}>
                  <div className="search-input-wrap" style={{ width: '100%' }}>
                    <Search size={16} />
                    <Input
                      placeholder="Type party code or company name to search..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setIsClientDropdownOpen(true);
                        if (!e.target.value) {
                          setFormData((prev) => ({ ...prev, client: '' }));
                        }
                      }}
                      onFocus={() => setIsClientDropdownOpen(true)}
                      disabled={submitting || loadingMasters}
                      style={{ paddingRight: formData.client ? '32px' : '10px' }}
                    />
                    {formData.client && (
                      <button
                        type="button"
                        onClick={clearParty}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--neutral-500)',
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Options List */}
                  {isClientDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        backgroundColor: '#fff',
                        border: '1px solid var(--neutral-300)',
                        borderRadius: '4px',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 200,
                        marginTop: '2px',
                      }}
                    >
                      {filteredClients.length > 0 ? (
                        filteredClients.map((party) => (
                          <div
                            key={party._id}
                            onClick={() => selectParty(party)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--neutral-100)',
                              backgroundColor: formData.client === party._id ? 'var(--primary-50)' : '#fff',
                            }}
                            className="search-option-item"
                          >
                            <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                              {party.companyName}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)', display: 'flex', gap: '12px' }}>
                              <span>Code: <strong>{party.clientCode}</strong></span>
                              {party.contactPerson && <span>Contact: {party.contactPerson}</span>}
                              {party.city && <span>City: {party.city}</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '10px', fontSize: '12px', color: 'var(--neutral-500)', textAlign: 'center' }}>
                          No active Party records match "{clientSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedPartyObj && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--primary-800)', backgroundColor: 'var(--primary-50)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--primary-200)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Party Selected: <strong>{selectedPartyObj.companyName}</strong> ({selectedPartyObj.clientCode})</span>
                    {selectedPartyObj.mobile && <span>Ph: {selectedPartyObj.mobile}</span>}
                  </div>
                )}
              </FormField>
            </div>

            <FormField label="Requirement Date" required>
              <Input
                type="date"
                name="requirementDate"
                value={formData.requirementDate}
                onChange={handleFormChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Enquiry Type" required>
              <Select
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                disabled={submitting}
              >
                <option value="product">Product Enquiry (Air Filter / Assembly)</option>
                <option value="service">Service Enquiry (Maintenance / Custom)</option>
              </Select>
            </FormField>

            <FormField label="Sales Person (Assigned Employee)">
              <Select
                name="salesPerson"
                value={formData.salesPerson}
                onChange={handleFormChange}
                disabled={submitting || loadingMasters}
              >
                <option value="">-- Unassigned --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Follow-up Date" helperText="Optional target date for client follow-up">
              <Input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleFormChange}
                disabled={submitting}
              />
            </FormField>
          </div>
        </div>

        {/* SECTION 2: REQUIREMENT & ITEM DETAILS */}
        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Package size={14} /> 2. Requirement Details & Specifications
          </div>

          {formData.type === 'product' ? (
            <div className="form-grid">
              <FormField label="Filter by Item Category" helperText="Select category to narrow down item options">
                <Select
                  name="itemCategory"
                  value={formData.itemCategory}
                  onChange={(e) => {
                    handleFormChange(e);
                    // Clear item if category changes and current item doesn't match
                    if (selectedItemObj) {
                      const itemCatId = typeof selectedItemObj.itemCategory === 'object' ? selectedItemObj.itemCategory?._id : selectedItemObj.itemCategory;
                      if (itemCatId && itemCatId !== e.target.value) {
                        clearItem();
                      }
                    }
                  }}
                  disabled={submitting || loadingMasters}
                >
                  <option value="">-- All Categories --</option>
                  {itemCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.categoryName} ({cat.categoryCode})
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* Searchable Item Selector */}
              <div style={{ gridColumn: 'span 2' }}>
                <FormField label="Required Item / Air Filter" helperText="Select standard catalog item from Item Master (Optional if custom filter requirement)">
                  <div style={{ position: 'relative' }}>
                    <div className="search-input-wrap" style={{ width: '100%' }}>
                      <Search size={16} />
                      <Input
                        placeholder="Search item by code or name..."
                        value={itemSearch}
                        onChange={(e) => {
                          setItemSearch(e.target.value);
                          setIsItemDropdownOpen(true);
                          if (!e.target.value) {
                            setFormData((prev) => ({ ...prev, item: '' }));
                          }
                        }}
                        onFocus={() => setIsItemDropdownOpen(true)}
                        disabled={submitting || loadingMasters}
                        style={{ paddingRight: formData.item ? '32px' : '10px' }}
                      />
                      {formData.item && (
                        <button
                          type="button"
                          onClick={clearItem}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--neutral-500)',
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {isItemDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          maxHeight: '200px',
                          overflowY: 'auto',
                          backgroundColor: '#fff',
                          border: '1px solid var(--neutral-300)',
                          borderRadius: '4px',
                          boxShadow: 'var(--shadow-md)',
                          zIndex: 200,
                          marginTop: '2px',
                        }}
                      >
                        {filteredItems.length > 0 ? (
                          filteredItems.map((item) => (
                            <div
                              key={item._id}
                              onClick={() => selectItem(item)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--neutral-100)',
                                backgroundColor: formData.item === item._id ? 'var(--primary-50)' : '#fff',
                              }}
                              className="search-option-item"
                            >
                              <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                                {item.itemName}
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }}>
                                Code: <strong>{item.itemCode}</strong>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '10px', fontSize: '12px', color: 'var(--neutral-500)', textAlign: 'center' }}>
                            No active items found matching "{itemSearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </FormField>
              </div>

              <FormField label="Required Quantity" required>
                <Input
                  type="number"
                  step="any"
                  min="0.000001"
                  name="quantity"
                  placeholder="e.g. 50"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  disabled={submitting}
                />
              </FormField>

              <FormField label="Unit of Measure (UOM)" required>
                <Select
                  name="uom"
                  value={formData.uom}
                  onChange={handleFormChange}
                  disabled={submitting || loadingMasters}
                >
                  <option value="">-- Select UOM --</option>
                  {uoms.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.uomName} ({u.uomCode})
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* Physical Dimensions */}
              <div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '6px' }}>
                  Filter Dimensions (Optional specifications)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  <Input
                    name="length"
                    placeholder="Length"
                    value={formData.dimensions.length}
                    onChange={handleDimensionChange}
                    disabled={submitting}
                  />
                  <Input
                    name="width"
                    placeholder="Width"
                    value={formData.dimensions.width}
                    onChange={handleDimensionChange}
                    disabled={submitting}
                  />
                  <Input
                    name="height"
                    placeholder="Height / Depth"
                    value={formData.dimensions.height}
                    onChange={handleDimensionChange}
                    disabled={submitting}
                  />
                  <Select
                    name="unit"
                    value={formData.dimensions.unit}
                    onChange={handleDimensionChange}
                    disabled={submitting}
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="inch">inch</option>
                    <option value="m">m</option>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <FormField label="Service Description / Requirements" required helperText="Provide detailed scope of service requested by customer">
                <Textarea
                  name="serviceDescription"
                  rows={4}
                  placeholder="e.g. Air filter maintenance, air audit, duct cleaning, or custom filter installation service required..."
                  value={formData.serviceDescription}
                  onChange={handleFormChange}
                  disabled={submitting}
                />
              </FormField>
            </div>
          )}

          {/* Dynamic Specifications Key-Value Pairs */}
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--neutral-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-700)' }}>
                Additional Specification Requirements
              </span>
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addSpecificationRow}>
                Add Specification
              </Button>
            </div>

            {formData.specifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {formData.specifications.map((spec, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Input
                      placeholder="Specification (e.g. Media Type / MERV Rating / Temp)"
                      value={spec.key}
                      onChange={(e) => updateSpecificationRow(idx, 'key', e.target.value)}
                      disabled={submitting}
                      style={{ flex: 1 }}
                    />
                    <Input
                      placeholder="Value / Requirement (e.g. HEPA H13 / 120°C)"
                      value={spec.value}
                      onChange={(e) => updateSpecificationRow(idx, 'value', e.target.value)}
                      disabled={submitting}
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => removeSpecificationRow(idx)}
                      style={{ color: 'var(--danger-600)' }}
                      title="Remove specification row"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--neutral-500)', fontStyle: 'italic' }}>
                No custom specifications added. Click "+ Add Specification" if customer requested custom technical parameters.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: STATUS & REMARKS */}
        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '10px' }}>
            3. Workflow Status & Internal Remarks
          </div>
          <div className="form-grid">
            <FormField label="Enquiry Status" required>
              <Select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                disabled={submitting}
              >
                <option value="draft">Draft</option>
                <option value="quotation_pending">Quotation Pending</option>
                <option value="quoted">Quoted</option>
                <option value="follow_up">Follow Up</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FormField>

            <div style={{ gridColumn: 'span 2' }}>
              <FormField label="Remarks / Internal Notes">
                <Textarea
                  name="remarks"
                  rows={2}
                  placeholder="Enter any additional context, customer urgency, delivery notes, etc."
                  value={formData.remarks}
                  onChange={handleFormChange}
                  disabled={submitting}
                />
              </FormField>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RequirementFormModal;
