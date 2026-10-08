import React, { useState, useEffect, useMemo } from 'react';
import { createRequirement, updateRequirement } from '../../services/requirementService';
import { getClients } from '../../services/clientService';
import { getItems } from '../../services/itemService';
import { getItemCategories } from '../../services/itemCategoryService';
import { getUOMs } from '../../services/uomService';
import { getEmployees } from '../../services/employeeService';
import { getFlangeDesigns } from '../../services/flangeDesignService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { 
  Search, 
  X, 
  Plus, 
  Trash2, 
  User, 
  Package, 
  Maximize2, 
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const createNewItemObj = (idIndex = 0, defaultFlangeId = '') => ({
  id: `item_${Date.now()}_${idIndex}_${Math.random().toString(36).substring(2, 7)}`,
  itemCategory: '',
  item: '',
  quantity: '',
  uom: '',
  constructionType: 'FLANGE',
  flangeDesign: defaultFlangeId || '',
  dimensions: {
    bodyWidth: '',
    bodyHeight: '',
    depth: '',
    overallFlangeWidth: '',
    overallFlangeHeight: '',
    unit: 'mm',
  },
  specifications: [],
  remarks: '',
  isExpanded: true,
  itemSearch: '',
  isItemDropdownOpen: false,
});

const RequirementFormModal = ({ requirement, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!requirement;

  // Master options state
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [flangeDesigns, setFlangeDesigns] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(false);

  // Search states for party dropdown selector
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

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

  // Main Form state
  const [formData, setFormData] = useState({
    client: '',
    requirementDate: new Date().toISOString().split('T')[0],
    type: 'product',
    serviceDescription: '',
    items: [createNewItemObj(0)],
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
        const [cRes, iRes, catRes, uRes, eRes, fRes] = await Promise.all([
          getClients(),
          getItems(),
          getItemCategories(),
          getUOMs(),
          getEmployees(),
          getFlangeDesigns({ status: 'active' }),
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
        if (fRes.success && Array.isArray(fRes.flangeDesigns)) {
          setFlangeDesigns(fRes.flangeDesigns.filter((f) => f.status === 'active'));
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
    if (!isOpen) return;

    const defaultFlangeId = flangeDesigns.length > 0 ? (flangeDesigns.find(f => f.constructionType === 'FLANGE')?._id || '') : '';

    if (requirement) {
      const formattedReqDate = requirement.requirementDate
        ? new Date(requirement.requirementDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const formattedFollowDate = requirement.followUpDate
        ? new Date(requirement.followUpDate).toISOString().split('T')[0]
        : '';

      let formItems = [];

      if (Array.isArray(requirement.items) && requirement.items.length > 0) {
        formItems = requirement.items.map((reqItem, idx) => {
          const specs = Array.isArray(reqItem.specifications)
            ? reqItem.specifications.map((s) =>
                typeof s === 'object' && s !== null
                  ? { key: s.key || s.name || '', value: s.value || s.val || '' }
                  : { key: 'Spec', value: String(s) }
              )
            : [];

          const rawDims = reqItem.dimensions && typeof reqItem.dimensions === 'object' && !Array.isArray(reqItem.dimensions)
            ? reqItem.dimensions
            : {};

          const dims = {
            bodyWidth: rawDims.bodyWidth || rawDims.width || '',
            bodyHeight: rawDims.bodyHeight || rawDims.height || '',
            depth: rawDims.depth || rawDims.length || '',
            overallFlangeWidth: rawDims.overallFlangeWidth || rawDims.flangeWidth || '',
            overallFlangeHeight: rawDims.overallFlangeHeight || rawDims.flangeHeight || '',
            unit: rawDims.unit || 'mm',
          };

          const constType = reqItem.constructionType || rawDims.constructionType || 'FLANGE';
          const flangeId = reqItem.flangeDesign?._id || reqItem.flangeDesign || reqItem.flangeDesignSnapshot?.flangeDesignId || '';

          const itemObj = typeof reqItem.item === 'object' ? reqItem.item : null;
          const searchStr = itemObj ? `${itemObj.itemCode ? itemObj.itemCode + ' - ' : ''}${itemObj.itemName}` : '';

          return {
            id: `item_${Date.now()}_${idx}`,
            itemCategory: reqItem.itemCategory?._id || reqItem.itemCategory || '',
            item: reqItem.item?._id || reqItem.item || '',
            quantity: reqItem.quantity !== null && reqItem.quantity !== undefined ? reqItem.quantity : '',
            uom: reqItem.uom?._id || reqItem.uom || '',
            constructionType: constType,
            flangeDesign: flangeId || defaultFlangeId,
            dimensions: dims,
            specifications: specs,
            remarks: reqItem.remarks || '',
            isExpanded: true,
            itemSearch: searchStr,
            isItemDropdownOpen: false,
          };
        });
      } else {
        const specs = Array.isArray(requirement.specifications)
          ? requirement.specifications.map((s) =>
              typeof s === 'object' && s !== null
                ? { key: s.key || s.name || '', value: s.value || s.val || '' }
                : { key: 'Spec', value: String(s) }
            )
          : [];

        const rawDims = requirement.dimensions && typeof requirement.dimensions === 'object' && !Array.isArray(requirement.dimensions)
          ? requirement.dimensions
          : {};

        const dims = {
          bodyWidth: rawDims.bodyWidth || rawDims.width || '',
          bodyHeight: rawDims.bodyHeight || rawDims.height || '',
          depth: rawDims.depth || rawDims.length || '',
          overallFlangeWidth: rawDims.overallFlangeWidth || rawDims.flangeWidth || '',
          overallFlangeHeight: rawDims.overallFlangeHeight || rawDims.flangeHeight || '',
          unit: rawDims.unit || 'mm',
        };

        const constType = requirement.constructionType || rawDims.constructionType || 'FLANGE';
        const flangeId = requirement.flangeDesign?._id || requirement.flangeDesign || requirement.flangeDesignSnapshot?.flangeDesignId || '';
        const itemObj = typeof requirement.item === 'object' ? requirement.item : null;
        const searchStr = itemObj ? `${itemObj.itemCode ? itemObj.itemCode + ' - ' : ''}${itemObj.itemName}` : '';

        formItems = [{
          id: `item_${Date.now()}_0`,
          itemCategory: requirement.itemCategory?._id || requirement.itemCategory || '',
          item: requirement.item?._id || requirement.item || '',
          quantity: requirement.quantity !== null && requirement.quantity !== undefined ? requirement.quantity : '',
          uom: requirement.uom?._id || requirement.uom || '',
          constructionType: constType,
          flangeDesign: flangeId || defaultFlangeId,
          dimensions: dims,
          specifications: specs,
          remarks: '',
          isExpanded: true,
          itemSearch: searchStr,
          isItemDropdownOpen: false,
        }];
      }

      setFormData({
        client: requirement.client?._id || requirement.client || '',
        requirementDate: formattedReqDate,
        type: requirement.type || 'product',
        serviceDescription: requirement.serviceDescription || '',
        items: formItems,
        remarks: requirement.remarks || '',
        followUpDate: formattedFollowDate,
        status: requirement.status || 'draft',
        salesPerson: requirement.salesPerson?._id || requirement.salesPerson || '',
      });

      if (requirement.client) {
        const partyObj = typeof requirement.client === 'object' ? requirement.client : null;
        if (partyObj) {
          setClientSearch(`${partyObj.clientCode ? partyObj.clientCode + ' - ' : ''}${partyObj.companyName}`);
        }
      } else {
        setClientSearch('');
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        client: '',
        requirementDate: today,
        type: 'product',
        serviceDescription: '',
        items: [createNewItemObj(0, defaultFlangeId)],
        remarks: '',
        followUpDate: getFourDaysFromDate(today),
        status: 'draft',
        salesPerson: '',
      });
      setClientSearch('');
    }

    setErrorMessage('');
    setSuccessMessage('');
  }, [requirement, isOpen, flangeDesigns]);

  if (!isOpen) return null;

  // Filtered clients list
  const filteredClients = clients.filter((c) => {
    if (!clientSearch.trim()) return true;
    const term = clientSearch.toLowerCase();
    const code = (c.clientCode || '').toLowerCase();
    const name = (c.companyName || '').toLowerCase();
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

  const selectParty = (party) => {
    setFormData((prev) => ({ ...prev, client: party._id }));
    setClientSearch(`${party.clientCode ? party.clientCode + ' - ' : ''}${party.companyName}`);
    setIsClientDropdownOpen(false);
  };

  const clearParty = () => {
    setFormData((prev) => ({ ...prev, client: '' }));
    setClientSearch('');
  };

  // MULTI-ITEM ARRAY HANDLERS
  const handleAddItem = () => {
    const defaultFlangeId = flangeDesigns.length > 0 ? (flangeDesigns.find(f => f.constructionType === 'FLANGE')?._id || '') : '';
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        createNewItemObj(prev.items.length, defaultFlangeId),
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const toggleItemExpand = (index) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], isExpanded: !updated[index].isExpanded };
      return { ...prev, items: updated };
    });
  };

  const handleItemFieldChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleItemDimensionChange = (index, dimField, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        dimensions: {
          ...updated[index].dimensions,
          [dimField]: value,
        },
      };
      return { ...prev, items: updated };
    });
  };

  const handleSelectItemForIndex = (index, selectedItemObj) => {
    const itemCatId = typeof selectedItemObj.itemCategory === 'object' ? selectedItemObj.itemCategory?._id : selectedItemObj.itemCategory;
    const itemUomId = typeof selectedItemObj.salesUom === 'object' ? selectedItemObj.salesUom?._id : (selectedItemObj.salesUom || selectedItemObj.inventoryUom);

    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        item: selectedItemObj._id,
        itemCategory: itemCatId || updated[index].itemCategory,
        uom: itemUomId || updated[index].uom,
        itemSearch: `${selectedItemObj.itemCode ? selectedItemObj.itemCode + ' - ' : ''}${selectedItemObj.itemName}`,
        isItemDropdownOpen: false,
      };
      return { ...prev, items: updated };
    });
  };

  const handleClearItemForIndex = (index) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        item: '',
        itemSearch: '',
      };
      return { ...prev, items: updated };
    });
  };

  const addItemSpecificationRow = (index) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        specifications: [...updated[index].specifications, { key: '', value: '' }],
      };
      return { ...prev, items: updated };
    });
  };

  const updateItemSpecificationRow = (itemIndex, specIndex, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      const updatedSpecs = [...updated[itemIndex].specifications];
      updatedSpecs[specIndex] = { ...updatedSpecs[specIndex], [field]: value };
      updated[itemIndex] = { ...updated[itemIndex], specifications: updatedSpecs };
      return { ...prev, items: updated };
    });
  };

  const removeItemSpecificationRow = (itemIndex, specIndex) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[itemIndex] = {
        ...updated[itemIndex],
        specifications: updated[itemIndex].specifications.filter((_, i) => i !== specIndex),
      };
      return { ...prev, items: updated };
    });
  };

  const validate = () => {
    if (!formData.client) {
      return 'Please select a Party / Customer.';
    }
    if (!formData.requirementDate) {
      return 'Requirement Date is required.';
    }

    if (formData.type === 'product') {
      if (!formData.items || formData.items.length === 0) {
        return 'At least one item is required for product enquiries.';
      }

      for (let i = 0; i < formData.items.length; i++) {
        const itemObj = formData.items[i];
        const numLabel = `Item #${i + 1}`;

        if (!itemObj.uom) {
          return `${numLabel}: UOM is required.`;
        }
        if (!itemObj.quantity || Number(itemObj.quantity) <= 0) {
          return `${numLabel}: Quantity must be a valid number greater than 0.`;
        }
        if (!Number.isInteger(Number(itemObj.quantity))) {
          return `${numLabel}: Quantity cannot be a fractional/decimal number.`;
        }

        const cType = (itemObj.constructionType || 'FLANGE').toUpperCase();
        const bw = Number(itemObj.dimensions.bodyWidth);
        const bh = Number(itemObj.dimensions.bodyHeight);
        const d = Number(itemObj.dimensions.depth);

        if (!bw || bw <= 0) return `${numLabel}: Body Width must be a positive number.`;
        if (!bh || bh <= 0) return `${numLabel}: Body Height must be a positive number.`;
        if (!d || d <= 0) return `${numLabel}: Depth must be a positive number.`;

        if (cType === 'FLANGE') {
          if (!itemObj.flangeDesign) {
            return `${numLabel}: Flange Design selection is required when constructionType is FLANGE.`;
          }
          const fw = Number(itemObj.dimensions.overallFlangeWidth);
          const fh = Number(itemObj.dimensions.overallFlangeHeight);

          if (!fw || fw <= 0) return `${numLabel}: Flange Width must be a positive number.`;
          if (!fh || fh <= 0) return `${numLabel}: Flange Height must be a positive number.`;
        }
      }
    } else {
      if (!formData.serviceDescription.trim()) {
        return 'Service Description is required for service enquiries.';
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

    const formattedItems = formData.type === 'product' ? formData.items.map((itemObj) => ({
      itemCategory: itemObj.itemCategory || null,
      item: itemObj.item || null,
      quantity: itemObj.quantity ? Number(itemObj.quantity) : null,
      uom: itemObj.uom || null,
      constructionType: itemObj.constructionType || 'FLANGE',
      flangeDesign: itemObj.constructionType === 'FLANGE' ? itemObj.flangeDesign : null,
      dimensions: {
        constructionType: itemObj.constructionType,
        bodyWidth: Number(itemObj.dimensions.bodyWidth),
        bodyHeight: Number(itemObj.dimensions.bodyHeight),
        depth: Number(itemObj.dimensions.depth),
        overallFlangeWidth: itemObj.constructionType === 'FLANGE' ? Number(itemObj.dimensions.overallFlangeWidth) : undefined,
        overallFlangeHeight: itemObj.constructionType === 'FLANGE' ? Number(itemObj.dimensions.overallFlangeHeight) : undefined,
        width: Number(itemObj.dimensions.bodyWidth),
        height: Number(itemObj.dimensions.bodyHeight),
        length: Number(itemObj.dimensions.depth),
        flangeWidth: itemObj.constructionType === 'FLANGE' ? Number(itemObj.dimensions.overallFlangeWidth) : undefined,
        flangeHeight: itemObj.constructionType === 'FLANGE' ? Number(itemObj.dimensions.overallFlangeHeight) : undefined,
        unit: itemObj.dimensions.unit || 'mm',
      },
      specifications: (itemObj.specifications || []).filter((s) => s.key?.trim() || s.value?.trim()),
      remarks: itemObj.remarks || '',
    })) : [];

    const firstItem = formattedItems[0] || {};

    const payload = {
      client: formData.client,
      requirementDate: formData.requirementDate,
      type: formData.type,
      serviceDescription: formData.type === 'service' ? formData.serviceDescription : '',
      items: formattedItems,
      itemCategory: firstItem.itemCategory || null,
      item: firstItem.item || null,
      quantity: firstItem.quantity || null,
      uom: firstItem.uom || null,
      constructionType: firstItem.constructionType || 'FLANGE',
      flangeDesign: firstItem.flangeDesign || null,
      dimensions: firstItem.dimensions || {},
      specifications: firstItem.specifications || [],
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

  const selectedPartyObj = clients.find((c) => c._id === formData.client) || (typeof requirement?.client === 'object' && requirement?.client?._id === formData.client ? requirement.client : null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditMode
          ? `Edit Requirement / Enquiry (${requirement.requirementNo})`
          : 'New Customer Requirement / Enquiry'
      }
      maxWidth="860px"
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
                  <div className="relative flex-1 min-w-[220px]" style={{ width: '100%' }}>
                    <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <Input
                      className="pl-8"
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

        {/* SECTION 2: REQUIREMENT ITEMS & ENGINEERING SPECIFICATIONS */}
        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={14} /> 2. Requirement Items ({formData.items.length})
            </div>
            {formData.type === 'product' && (
              <Button type="button" variant="primary" size="sm" icon={Plus} onClick={handleAddItem}>
                Add More Item
              </Button>
            )}
          </div>

          {formData.type === 'product' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* ITEM ACCORDION CARDS WITH FULL VISUAL FLANGE SELECTOR */}
              {formData.items.map((itemObj, itemIndex) => {
                const selectedCatalogItem = items.find((i) => i._id === itemObj.item) || null;
                const selectedFlangeDesignObj = flangeDesigns.find((f) => f._id === itemObj.flangeDesign) || null;

                const filteredItems = items.filter((i) => {
                  if (itemObj.itemCategory) {
                    const catId = typeof i.itemCategory === 'object' ? i.itemCategory?._id : i.itemCategory;
                    if (catId && catId !== itemObj.itemCategory) return false;
                  }
                  if (!itemObj.itemSearch.trim()) return true;
                  const term = itemObj.itemSearch.toLowerCase();
                  const code = (i.itemCode || '').toLowerCase();
                  const name = (i.itemName || '').toLowerCase();
                  return code.includes(term) || name.includes(term);
                });

                let summaryTitle = selectedCatalogItem
                  ? selectedCatalogItem.itemName
                  : itemObj.dimensions.bodyWidth && itemObj.dimensions.bodyHeight
                  ? `${itemObj.constructionType} Filter (${itemObj.dimensions.bodyWidth}×${itemObj.dimensions.bodyHeight}×${itemObj.dimensions.depth || '0'}mm)`
                  : `Item #${itemIndex + 1}`;

                return (
                  <div
                    key={itemObj.id || itemIndex}
                    style={{
                      border: '1px solid var(--neutral-300)',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden',
                    }}
                  >
                    {/* ACCORDION HEADER BAR WITH REDESIGNED ITEM BADGE */}
                    <div
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#f8fafc',
                        borderBottom: itemObj.isExpanded ? '1px solid var(--neutral-200)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }} onClick={() => toggleItemExpand(itemIndex)}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>
                          Item #{itemIndex + 1}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                          {summaryTitle}
                        </span>
                        {itemObj.quantity && (
                          <span style={{ fontSize: '11.5px', color: 'var(--neutral-600)' }}>
                            (Qty: {itemObj.quantity})
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleRemoveItem(itemIndex)}
                            style={{ color: '#dc2626' }}
                            title="Remove Item"
                          />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          icon={itemObj.isExpanded ? ChevronUp : ChevronDown}
                          onClick={() => toggleItemExpand(itemIndex)}
                          style={{ color: 'var(--neutral-600)' }}
                        >
                          {itemObj.isExpanded ? 'Hide' : 'Edit'}
                        </Button>
                      </div>
                    </div>

                    {/* EXPANDABLE BODY WITH FULL VISUAL FLANGE SELECTOR & DIMENSIONS */}
                    {itemObj.isExpanded && (
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="form-grid">
                          {/* Item Category Filter */}
                          <FormField label="Filter by Item Category">
                            <Select
                              value={itemObj.itemCategory}
                              onChange={(e) => {
                                handleItemFieldChange(itemIndex, 'itemCategory', e.target.value);
                                if (selectedCatalogItem) {
                                  const catId = typeof selectedCatalogItem.itemCategory === 'object' ? selectedCatalogItem.itemCategory?._id : selectedCatalogItem.itemCategory;
                                  if (catId && catId !== e.target.value) {
                                    handleClearItemForIndex(itemIndex);
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
                                <div className="relative flex-1 min-w-[220px]" style={{ width: '100%' }}>
                                  <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                  <Input
                                    className="pl-8"
                                    placeholder="Search catalog item by code or name..."
                                    value={itemObj.itemSearch}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormData((prev) => {
                                        const updated = [...prev.items];
                                        updated[itemIndex] = {
                                          ...updated[itemIndex],
                                          itemSearch: val,
                                          isItemDropdownOpen: true,
                                          item: val ? updated[itemIndex].item : '',
                                        };
                                        return { ...prev, items: updated };
                                      });
                                    }}
                                    onFocus={() => {
                                      setFormData((prev) => {
                                        const updated = [...prev.items];
                                        updated[itemIndex] = { ...updated[itemIndex], isItemDropdownOpen: true };
                                        return { ...prev, items: updated };
                                      });
                                    }}
                                    disabled={submitting || loadingMasters}
                                    style={{ paddingRight: itemObj.item ? '32px' : '10px' }}
                                  />
                                  {itemObj.item && (
                                    <button
                                      type="button"
                                      onClick={() => handleClearItemForIndex(itemIndex)}
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

                                {itemObj.isItemDropdownOpen && (
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
                                      filteredItems.map((itm) => (
                                        <div
                                          key={itm._id}
                                          onClick={() => handleSelectItemForIndex(itemIndex, itm)}
                                          style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--neutral-100)',
                                            backgroundColor: itemObj.item === itm._id ? 'var(--primary-50)' : '#fff',
                                          }}
                                          className="search-option-item"
                                        >
                                          <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                                            {itm.itemName}
                                          </div>
                                          <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }}>
                                            Code: <strong>{itm.itemCode}</strong>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div style={{ padding: '10px', fontSize: '12px', color: 'var(--neutral-500)', textAlign: 'center' }}>
                                        No active items found matching "{itemObj.itemSearch}"
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {selectedCatalogItem && (
                                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--primary-800)', backgroundColor: 'var(--primary-50)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--primary-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    Catalog Item Selected: <strong>{selectedCatalogItem.itemName}</strong> ({selectedCatalogItem.itemCode})
                                    {selectedCatalogItem.filterGrade && (
                                      <div style={{ fontSize: '11px', color: 'var(--neutral-600)', marginTop: '2px' }}>
                                        Filter Grade: <strong>{typeof selectedCatalogItem.filterGrade === 'object' ? selectedCatalogItem.filterGrade.filterGrade : selectedCatalogItem.filterGrade}</strong>
                                        {typeof selectedCatalogItem.filterGrade === 'object' && selectedCatalogItem.filterGrade.eurovent ? ` (${selectedCatalogItem.filterGrade.eurovent})` : ''}
                                      </div>
                                    )}
                                  </div>
                                  <button type="button" onClick={() => handleClearItemForIndex(itemIndex)} className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 bg-white border border-red-200 rounded shadow-xs">
                                    Change Item
                                  </button>
                                </div>
                              )}
                            </FormField>
                          </div>

                          <FormField label="Required Quantity" required>
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              placeholder="e.g. 50"
                              value={itemObj.quantity}
                              onChange={(e) => handleItemFieldChange(itemIndex, 'quantity', e.target.value)}
                              disabled={submitting}
                            />
                          </FormField>

                          <FormField label="Unit of Measure (UOM)" required>
                            <Select
                              value={itemObj.uom}
                              onChange={(e) => handleItemFieldChange(itemIndex, 'uom', e.target.value)}
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

                          {/* CONSTRUCTION TYPE SEGMENTED SWITCHER CARDS */}
                          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-700)' }}>
                              Filter Construction Type <span style={{ color: 'red' }}>*</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <button
                                type="button"
                                onClick={() => handleItemFieldChange(itemIndex, 'constructionType', 'FLANGE')}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  border: itemObj.constructionType === 'FLANGE' ? '2px solid #2563eb' : '1px solid var(--neutral-300)',
                                  backgroundColor: itemObj.constructionType === 'FLANGE' ? '#eff6ff' : '#ffffff',
                                  color: itemObj.constructionType === 'FLANGE' ? '#1e40af' : 'var(--neutral-700)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.15s ease-in-out',
                                }}
                              >
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: itemObj.constructionType === 'FLANGE' ? '5px solid #2563eb' : '2px solid var(--neutral-400)', backgroundColor: '#fff', flexShrink: 0 }} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '13px' }}>FLANGE Construction</div>
                                  <div style={{ fontSize: '11px', color: itemObj.constructionType === 'FLANGE' ? '#3b82f6' : 'var(--neutral-500)' }}>
                                    Filter Body + External Flange Dimensions
                                  </div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleItemFieldChange(itemIndex, 'constructionType', 'BOX');
                                  handleItemFieldChange(itemIndex, 'flangeDesign', '');
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  border: itemObj.constructionType === 'BOX' ? '2px solid #7c3aed' : '1px solid var(--neutral-300)',
                                  backgroundColor: itemObj.constructionType === 'BOX' ? '#faf5ff' : '#ffffff',
                                  color: itemObj.constructionType === 'BOX' ? '#5b21b6' : 'var(--neutral-700)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.15s ease-in-out',
                                }}
                              >
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: itemObj.constructionType === 'BOX' ? '5px solid #7c3aed' : '2px solid var(--neutral-400)', backgroundColor: '#fff', flexShrink: 0 }} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '13px' }}>BOX Construction</div>
                                  <div style={{ fontSize: '11px', color: itemObj.constructionType === 'BOX' ? '#8b5cf6' : 'var(--neutral-500)' }}>
                                    Standard Box Filter (No External Flange)
                                  </div>
                                </div>
                              </button>
                            </div>

                            {/* FLANGE DESIGN VISUAL CARDS SELECTOR (RESTORED) */}
                            {itemObj.constructionType === 'FLANGE' && (
                              <div style={{ marginTop: '6px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>Select Flange Design Specification <span style={{ color: 'red' }}>*</span></span>
                                  <span style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Choose flange geometry & slot pattern</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                  {flangeDesigns
                                    .filter((f) => f.constructionType === 'FLANGE')
                                    .map((design) => {
                                      const isSelected = itemObj.flangeDesign === design._id;
                                      return (
                                        <div
                                          key={design._id}
                                          onClick={() => handleItemFieldChange(itemIndex, 'flangeDesign', design._id)}
                                          style={{
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: isSelected ? '2px solid #2563eb' : '1px solid var(--neutral-300)',
                                            backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                                            boxShadow: isSelected ? '0 2px 8px rgba(37,99,235,0.15)' : 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease-in-out',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            gap: '8px'
                                          }}
                                        >
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: isSelected ? '#dbeafe' : 'var(--neutral-200)', color: isSelected ? '#1e40af' : 'var(--neutral-700)', fontFamily: 'monospace' }}>
                                              {design.designCode}
                                            </span>
                                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: isSelected ? '4px solid #2563eb' : '1px solid var(--neutral-400)', backgroundColor: '#fff' }} />
                                          </div>

                                          <div>
                                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                                              {design.designName}
                                            </div>
                                            {design.description && (
                                              <div style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '2px', lineHeight: '1.3' }}>
                                                {design.description}
                                              </div>
                                            )}
                                          </div>

                                          {design.referenceImage && (
                                            <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#ffffff', padding: '4px', borderRadius: '4px', border: '1px solid var(--neutral-200)', marginTop: '2px' }}>
                                              <img
                                                src={design.referenceImage}
                                                alt={design.designName}
                                                style={{ maxHeight: '55px', objectFit: 'contain' }}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ENGINEERING DIMENSION SPECIFICATION SECTION (RESTORED) */}
                          <div style={{ gridColumn: 'span 2', marginTop: '6px', padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--neutral-300)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--neutral-200)' }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Maximize2 size={15} className="text-blue-600" /> ENGINEERING DIMENSION SPECIFICATION
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--neutral-600)', fontFamily: 'monospace', backgroundColor: 'var(--neutral-100)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                                Unit: mm
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {/* Section A: Filter Body Dimensions */}
                              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                  A. Filter Body Dimensions
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                  <FormField label="Body Width (mm)" required>
                                    <Input
                                      type="number"
                                      placeholder="e.g. 610"
                                      value={itemObj.dimensions.bodyWidth}
                                      onChange={(e) => handleItemDimensionChange(itemIndex, 'bodyWidth', e.target.value)}
                                      disabled={submitting}
                                    />
                                  </FormField>

                                  <FormField label="Body Height (mm)" required>
                                    <Input
                                      type="number"
                                      placeholder="e.g. 610"
                                      value={itemObj.dimensions.bodyHeight}
                                      onChange={(e) => handleItemDimensionChange(itemIndex, 'bodyHeight', e.target.value)}
                                      disabled={submitting}
                                    />
                                  </FormField>

                                  <FormField label="Depth (mm)" required>
                                    <Input
                                      type="number"
                                      placeholder="e.g. 292"
                                      value={itemObj.dimensions.depth}
                                      onChange={(e) => handleItemDimensionChange(itemIndex, 'depth', e.target.value)}
                                      disabled={submitting}
                                    />
                                  </FormField>
                                </div>
                              </div>

                              {/* Section B: Overall Flange Dimensions */}
                              {itemObj.constructionType === 'FLANGE' && (
                                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e40af', marginBottom: '8px' }}>
                                    B. Overall Flange Dimensions
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <FormField label="Flange Width (mm)" required>
                                      <Input
                                        type="number"
                                        placeholder="e.g. 650"
                                        value={itemObj.dimensions.overallFlangeWidth}
                                        onChange={(e) => handleItemDimensionChange(itemIndex, 'overallFlangeWidth', e.target.value)}
                                        disabled={submitting}
                                      />
                                    </FormField>

                                    <FormField label="Flange Height (mm)" required>
                                      <Input
                                        type="number"
                                        placeholder="e.g. 650"
                                        value={itemObj.dimensions.overallFlangeHeight}
                                        onChange={(e) => handleItemDimensionChange(itemIndex, 'overallFlangeHeight', e.target.value)}
                                        disabled={submitting}
                                      />
                                    </FormField>
                                  </div>
                                </div>
                              )}

                              {/* Reference Design Preview Box */}
                              {itemObj.constructionType === 'FLANGE' && selectedFlangeDesignObj && (
                                <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ImageIcon size={15} className="text-blue-600" />
                                    <span>Reference Design Preview — {selectedFlangeDesignObj.designCode} ({selectedFlangeDesignObj.designName})</span>
                                  </div>
                                  {selectedFlangeDesignObj.referenceImage ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                      <img
                                        src={selectedFlangeDesignObj.referenceImage}
                                        alt={selectedFlangeDesignObj.designName}
                                        style={{ maxHeight: '180px', objectFit: 'contain' }}
                                      />
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic', padding: '6px' }}>
                                      No reference image uploaded for this design.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Item Remarks */}
                        <FormField label="Item Remarks / Special Requirements">
                          <Input
                            placeholder="Enter specific notes for this filter item..."
                            value={itemObj.remarks}
                            onChange={(e) => handleItemFieldChange(itemIndex, 'remarks', e.target.value)}
                            disabled={submitting}
                          />
                        </FormField>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* BUTTON TO ADD MORE ITEMS */}
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px dashed #2563eb',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  marginTop: '4px',
                }}
                className="hover:bg-blue-100 hover:border-blue-700"
              >
                <Plus size={18} />
                <span>Add More Item</span>
              </button>
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
        </div>

        {/* SECTION 3: WORKFLOW STATUS & REMARKS */}
        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '10px' }}>
            3. Workflow Status & Overall Remarks
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
              <FormField label="Overall Remarks / Internal Notes">
                <Textarea
                  name="remarks"
                  rows={2}
                  placeholder="Enter any overall context, customer urgency, delivery notes, etc."
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
