import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { FormField, Select, Input } from '../../components/ui/FormField';
import {
  getCategorySpecifications,
  assignCategorySpecification,
  updateCategorySpecification,
  removeCategorySpecification
} from '../../services/itemCategoryService';
import { getSpecifications } from '../../services/specificationService';
import { Edit, Layers, Plus, Trash2, CheckCircle, Sliders } from 'lucide-react';

const ItemCategoryDetailModal = ({ category, isOpen, onClose, onEdit, canEdit }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'specifications'
  const [categorySpecs, setCategorySpecs] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [masterSpecs, setMasterSpecs] = useState([]);

  // Add specification form state
  const [selectedSpecId, setSelectedSpecId] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCategorySpecs = async () => {
    if (!category?._id) return;
    setLoadingSpecs(true);
    try {
      const res = await getCategorySpecifications(category._id);
      if (res.success && Array.isArray(res.specifications)) {
        setCategorySpecs(res.specifications);
      }
    } catch (err) {
      console.error("Failed to load Category Specifications:", err);
    } finally {
      setLoadingSpecs(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !category) return;

    setActiveTab('details');
    setErrorMessage('');
    setSuccessMessage('');
    setSelectedSpecId('');
    setIsRequired(false);
    setDisplayOrder(0);

    fetchCategorySpecs();

    // Fetch master specifications for assignment dropdown
    getSpecifications()
      .then((res) => {
        if (res.success && Array.isArray(res.specifications)) {
          setMasterSpecs(res.specifications.filter((s) => s.status === 'active'));
        }
      })
      .catch(console.error);
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupCode = category.itemGroup?.groupCode;
  const groupName = category.itemGroup?.groupName;

  // Unassigned specifications available for adding to this category
  const assignedSpecIds = categorySpecs.map((cs) => cs.specification?._id || cs.specification);
  const availableMasterSpecs = masterSpecs.filter((ms) => !assignedSpecIds.includes(ms._id));

  const handleAddSpecification = async (e) => {
    e.preventDefault();
    if (!selectedSpecId) {
      setErrorMessage('Please select a specification to assign.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await assignCategorySpecification(category._id, {
        specificationId: selectedSpecId,
        required: isRequired,
        displayOrder: Number(displayOrder) || 0
      });

      if (res.success) {
        setSuccessMessage('Specification assigned to category!');
        setSelectedSpecId('');
        setIsRequired(false);
        setDisplayOrder(0);
        fetchCategorySpecs();
      } else {
        setErrorMessage(res.message || 'Failed to assign specification.');
      }
    } catch (err) {
      console.error("Assign Specification error:", err);
      setErrorMessage(err.response?.data?.message || 'Error assigning specification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSpecification = async (specId, specName) => {
    if (!window.confirm(`Are you sure you want to remove "${specName}" from this category?`)) return;

    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await removeCategorySpecification(category._id, specId);
      if (res.success) {
        fetchCategorySpecs();
      }
    } catch (err) {
      console.error("Remove Specification error:", err);
      setErrorMessage(err.response?.data?.message || 'Error removing specification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRequirement = async (cs, requiredVal) => {
    const specId = cs.specification?._id || cs.specification;
    try {
      await updateCategorySpecification(category._id, specId, {
        required: requiredVal,
        displayOrder: cs.displayOrder
      });
      fetchCategorySpecs();
    } catch (err) {
      console.error("Update requirement error:", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Item Category Details — ${category.categoryCode}`}
      maxWidth="680px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              icon={Edit}
              onClick={() => {
                onClose();
                onEdit(category);
              }}
            >
              Edit Category
            </Button>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Navigation Tabs */}
        <div style={{ borderBottom: '1px solid var(--neutral-200)', marginBottom: '4px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'details' ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: activeTab === 'details' ? 'var(--primary-700)' : 'var(--neutral-600)',
                fontWeight: activeTab === 'details' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Category Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specifications')}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'specifications' ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: activeTab === 'specifications' ? 'var(--primary-700)' : 'var(--neutral-600)',
                fontWeight: activeTab === 'specifications' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Category Specifications {categorySpecs.length > 0 && `(${categorySpecs.length})`}
            </button>
          </div>
        </div>

        {errorMessage && <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />}
        {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />}

        {/* TAB 1: CATEGORY DETAILS */}
        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: 'var(--neutral-50)',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid var(--neutral-200)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Category Code
                </div>
                <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-700)', marginTop: '2px' }}>
                  {category.categoryCode}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Category Name
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-900)', marginTop: '2px' }}>
                  {category.categoryName}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Item Group
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--neutral-800)' }}>
                  <Layers size={14} color="var(--primary-600)" />
                  <span>{groupName ? `${groupCode} (${groupName})` : groupCode || '—'}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Status
                </div>
                <StatusBadge status={category.status} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--neutral-500)', fontWeight: 600, marginBottom: '4px' }}>
                Description
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: category.description ? 'var(--neutral-800)' : 'var(--neutral-400)',
                  backgroundColor: '#ffffff',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid var(--neutral-200)',
                  minHeight: '44px',
                }}
              >
                {category.description || 'No additional description provided.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: 'var(--neutral-500)', paddingTop: '8px' }}>
              <div>
                <strong>Created:</strong> {formatDate(category.createdAt)}
              </div>
              <div>
                <strong>Last Updated:</strong> {formatDate(category.updatedAt)}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORY SPECIFICATIONS CONFIGURATION */}
        {activeTab === 'specifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Form to Assign New Master Specification */}
            {canEdit && (
              <div style={{ backgroundColor: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '8px' }}>
                  Assign Specification Parameter to Category
                </div>

                <form onSubmit={handleAddSpecification} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px auto', gap: '8px', alignItems: 'flex-end' }}>
                  <FormField label="Specification Parameter" required>
                    <Select
                      value={selectedSpecId}
                      onChange={(e) => setSelectedSpecId(e.target.value)}
                      disabled={submitting || availableMasterSpecs.length === 0}
                    >
                      <option value="">
                        {availableMasterSpecs.length === 0 ? 'All active specs already assigned' : '-- Select Specification --'}
                      </option>
                      {availableMasterSpecs.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.specificationCode} — {s.specificationName} ({s.dataType})
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Order">
                    <Input
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(e.target.value)}
                      disabled={submitting}
                    />
                  </FormField>

                  <FormField label="Required?">
                    <div style={{ paddingTop: '6px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isRequired}
                          onChange={(e) => setIsRequired(e.target.checked)}
                          disabled={submitting}
                        />
                        Required
                      </label>
                    </div>
                  </FormField>

                  <Button
                    type="submit"
                    variant="primary"
                    icon={Plus}
                    disabled={submitting || !selectedSpecId}
                  >
                    Assign
                  </Button>
                </form>
              </div>
            )}

            {/* List of Configured Specifications for Category */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '8px' }}>
                Configured Technical Specifications ({categorySpecs.length})
              </div>

              {loadingSpecs ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--neutral-500)', fontSize: '13px' }}>
                  Loading category specifications...
                </div>
              ) : categorySpecs.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--neutral-500)', fontSize: '13px', backgroundColor: '#fff', border: '1px solid var(--neutral-200)', borderRadius: '6px' }}>
                  No specifications currently assigned to this category.
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>Order</th>
                        <th>Code</th>
                        <th>Specification Name</th>
                        <th>Data Type</th>
                        <th>UOM</th>
                        <th style={{ textAlign: 'center' }}>Required</th>
                        {canEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {categorySpecs.map((cs) => {
                        const spec = cs.specification;
                        if (!spec) return null;
                        return (
                          <tr key={cs._id}>
                            <td style={{ fontWeight: 600 }}>{cs.displayOrder ?? 0}</td>
                            <td className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
                              {spec.specificationCode}
                            </td>
                            <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                              {spec.specificationName}
                            </td>
                            <td>
                              <span style={{ fontSize: '11px', textTransform: 'uppercase', padding: '1px 6px', borderRadius: '4px', background: 'var(--neutral-100)', color: 'var(--neutral-700)' }}>
                                {spec.dataType}
                              </span>
                            </td>
                            <td>{spec.unit?.uomCode || '—'}</td>
                            <td style={{ textAlign: 'center' }}>
                              {canEdit ? (
                                <input
                                  type="checkbox"
                                  checked={!!cs.required}
                                  onChange={(e) => handleUpdateRequirement(cs, e.target.checked)}
                                  title="Toggle Mandatory Requirement"
                                />
                              ) : (
                                cs.required ? <span className="badge badge-danger">Required</span> : <span className="badge badge-neutral">Optional</span>
                              )}
                            </td>
                            {canEdit && (
                              <td style={{ textAlign: 'right' }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Trash2}
                                  onClick={() => handleRemoveSpecification(spec._id, spec.specificationName)}
                                  style={{ color: 'var(--danger-600)' }}
                                  title="Remove from Category"
                                >
                                  Remove
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ItemCategoryDetailModal;
