import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select, FormField } from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import { getItems } from '../../services/itemService';
import { getUOMs } from '../../services/uomService';
import {
  getBOMById,
  releaseBOM,
  getBOMRevisions,
  addBOMItem,
  updateBOMItem,
  deleteBOMItem
} from '../../services/masterBomService';
import {
  Package,
  Layers,
  CheckCircle2,
  Copy,
  Edit,
  Plus,
  Trash2,
  History,
  Lock,
  Clock,
  UserCheck
} from 'lucide-react';
import MasterBOMCopyModal from './MasterBOMCopyModal';
import MasterBOMFormModal from './MasterBOMFormModal';

const MasterBOMDetailModal = ({ isOpen, bomId, onClose, onBOMUpdated }) => {
  const { hasPermission } = useAuth();
  const canRelease = hasPermission('BOM_RELEASE');
  const canEdit = hasPermission('BOM_EDIT');
  const canCreate = hasPermission('BOM_CREATE');

  const [loading, setLoading] = useState(true);
  const [bom, setBom] = useState(null);
  const [items, setItems] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [activeTab, setActiveTab] = useState('components'); // 'components' | 'revisions'

  // Master options for inline item addition
  const [allActiveItems, setAllActiveItems] = useState([]);
  const [allActiveUoms, setAllActiveUoms] = useState([]);

  // Inline Component Modal / Form state
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [newCompItem, setNewCompItem] = useState('');
  const [newCompQty, setNewCompQty] = useState(1);
  const [newCompUom, setNewCompUom] = useState('');
  const [newCompPos, setNewCompPos] = useState('');
  const [newCompPrice, setNewCompPrice] = useState(0);
  const [newCompSeq, setNewCompSeq] = useState(10);
  const [newCompRemarks, setNewCompRemarks] = useState('');

  // Editing existing component state
  const [editingCompId, setEditingCompId] = useState(null);

  // Copy modal state
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [isEditHeaderOpen, setIsEditHeaderOpen] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBOMData = async () => {
    if (!bomId || !isOpen) return;
    setLoading(true);
    setError('');
    try {
      const [res, masterItemsRes, masterUomsRes] = await Promise.all([
        getBOMById(bomId),
        getItems().catch(() => ({ success: false, items: [] })),
        getUOMs().catch(() => ({ success: false, uoms: [] }))
      ]);

      if (res.success && res.bom) {
        setBom(res.bom);
        setItems(res.items || []);
      } else {
        setError('Failed to load Master BOM record');
      }

      if (masterItemsRes.success && Array.isArray(masterItemsRes.items)) {
        setAllActiveItems(masterItemsRes.items.filter(i => i.status === 'active'));
      }
      if (masterUomsRes.success && Array.isArray(masterUomsRes.uoms)) {
        setAllActiveUoms(masterUomsRes.uoms.filter(u => u.status === 'active'));
      }
    } catch (err) {
      console.error('Error loading BOM details:', err);
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevisionsData = async () => {
    if (!bomId) return;
    try {
      const res = await getBOMRevisions(bomId);
      if (res.success && Array.isArray(res.revisions)) {
        setRevisions(res.revisions);
      }
    } catch (err) {
      console.error('Failed to fetch BOM revisions:', err);
    }
  };

  useEffect(() => {
    fetchBOMData();
  }, [bomId, isOpen]);

  useEffect(() => {
    if (activeTab === 'revisions' && bomId) {
      fetchRevisionsData();
    }
  }, [activeTab, bomId]);

  const handleRelease = async () => {
    if (!bom) return;
    const confirmMsg = `Are you sure you want to RELEASE Master BOM "${bom.bomCode}" (Version ${bom.version})? Releasing locks this BOM and marks any previous released version as REVISED.`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await releaseBOM(bom._id);
      if (res.success) {
        setSuccessMsg(res.message || 'Master BOM released successfully');
        setBom(res.bom);
        if (onBOMUpdated) onBOMUpdated();
      } else {
        setError(res.message || 'Failed to release Master BOM');
      }
    } catch (err) {
      console.error('Release BOM error:', err);
      setError(err.response?.data?.message || 'Error releasing Master BOM');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComponentSubmit = async (e) => {
    e.preventDefault();
    if (!newCompItem || !newCompQty || !newCompUom) {
      setError('Please select Component Item, Quantity, and UOM.');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        componentItem: newCompItem,
        quantityPerParent: Number(newCompQty),
        uom: newCompUom,
        positionTagNo: newCompPos.trim(),
        price: Number(newCompPrice) || 0,
        sequence: Number(newCompSeq) || 0,
        remarks: newCompRemarks.trim()
      };

      const res = await addBOMItem(bom._id, payload);
      if (res.success) {
        setSuccessMsg('Component item added successfully');
        setIsAddComponentOpen(false);
        setNewCompItem('');
        setNewCompQty(1);
        setNewCompPos('');
        setNewCompPrice(0);
        fetchBOMData();
      } else {
        setError(res.message || 'Failed to add component item');
      }
    } catch (err) {
      console.error('Add component error:', err);
      setError(err.response?.data?.message || 'Error adding component item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteComponent = async (itemId) => {
    if (!window.confirm('Remove this component from draft Master BOM?')) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await deleteBOMItem(bom._id, itemId);
      if (res.success) {
        setSuccessMsg('Component item removed');
        fetchBOMData();
      } else {
        setError(res.message || 'Failed to remove component');
      }
    } catch (err) {
      console.error('Delete component error:', err);
      setError(err.response?.data?.message || 'Error removing component');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const isDraft = bom && bom.status === 'draft';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bom ? `Master BOM — ${bom.bomCode} (v${bom.version})` : 'Master BOM Details'}
      size="xl"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--neutral-500)' }}>
          Loading Master BOM information...
        </div>
      ) : !bom ? (
        <div style={{ padding: '20px', color: 'var(--danger-600)' }}>
          Master BOM record not found.
        </div>
      ) : (
        <div>
          {/* Header Summary Banner */}
          <div className="card" style={{ padding: '16px', marginBottom: '16px', background: '#f8fafc', borderLeft: '4px solid var(--primary-600)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--primary-800)' }} className="font-mono">
                    {bom.bomCode}
                  </h3>
                  <span className="badge badge-primary" style={{ fontSize: '12px', fontWeight: 700 }}>
                    Version {bom.version}
                  </span>
                  <StatusBadge status={bom.status} />
                </div>

                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--neutral-900)' }}>
                  <strong>Parent Finished Item:</strong>{' '}
                  <span style={{ fontWeight: 600 }}>{bom.parentItem?.itemName || 'N/A'}</span>{' '}
                  <span style={{ fontSize: '12px', color: 'var(--neutral-500)' }} className="font-mono">
                    ({bom.parentItem?.itemCode || 'No Code'})
                  </span>
                </div>

                {bom.description && (
                  <div style={{ fontSize: '12.5px', color: 'var(--neutral-600)', marginTop: '4px' }}>
                    {bom.description}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {isDraft && canRelease && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRelease}
                    disabled={actionLoading || items.length === 0}
                    title={items.length === 0 ? 'Add at least 1 component to release BOM' : 'Release Master BOM'}
                  >
                    <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Release BOM
                  </Button>
                )}

                {canCreate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCopyOpen(true)}
                    disabled={actionLoading}
                    title="Duplicate / Create Revision of this BOM"
                  >
                    <Copy size={14} style={{ marginRight: '6px' }} /> Copy / Create Revision
                  </Button>
                )}

                {isDraft && canEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditHeaderOpen(true)}
                    disabled={actionLoading}
                  >
                    <Edit size={14} style={{ marginRight: '6px' }} /> Edit Header
                  </Button>
                )}
              </div>
            </div>

            {/* Immutability Banner */}
            {!isDraft && (
              <div style={{ marginTop: '12px', padding: '8px 12px', background: 'var(--neutral-100)', border: '1px solid var(--neutral-200)', borderRadius: '4px', fontSize: '12px', color: 'var(--neutral-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={14} color="var(--warning-600)" />
                <span>
                  This Master BOM is <strong>{bom.status.toUpperCase()}</strong> and immutable. To make modifications, click <strong>"Copy / Create Revision"</strong> to generate a new draft version.
                </span>
              </div>
            )}
          </div>

          {/* Audit Meta Card */}
          <div className="card" style={{ padding: '12px 16px', marginBottom: '16px', background: 'white' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--neutral-500)' }}>Effective From: </span>
                <strong>{bom.effectiveFrom ? new Date(bom.effectiveFrom).toLocaleDateString('en-GB') : '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--neutral-500)' }}>Effective To: </span>
                <strong>{bom.effectiveTo ? new Date(bom.effectiveTo).toLocaleDateString('en-GB') : 'Active / Present'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--neutral-500)' }}>Created By: </span>
                <strong>{bom.createdBy?.fullName || bom.createdBy?.username || 'System'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--neutral-500)' }}>Released By: </span>
                <strong>{bom.releasedBy?.fullName || bom.releasedBy?.username || '-'}</strong>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--neutral-200)', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('components')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'components' ? '2px solid var(--primary-600)' : 'none',
                fontWeight: activeTab === 'components' ? 600 : 400,
                color: activeTab === 'components' ? 'var(--primary-700)' : 'var(--neutral-600)',
                cursor: 'pointer'
              }}
            >
              BOM Component Structure ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('revisions')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'revisions' ? '2px solid var(--primary-600)' : 'none',
                fontWeight: activeTab === 'revisions' ? 600 : 400,
                color: activeTab === 'revisions' ? 'var(--primary-700)' : 'var(--neutral-600)',
                cursor: 'pointer'
              }}
            >
              Revision History
            </button>
          </div>

          {/* TAB 1: COMPONENT BREAKDOWN */}
          {activeTab === 'components' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--neutral-800)', textTransform: 'uppercase' }}>
                  Component Items List
                </h4>
                {isDraft && canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddComponentOpen(true)}
                  >
                    <Plus size={14} style={{ marginRight: '4px' }} /> Add Component Item
                  </Button>
                )}
              </div>

              {/* Add Component Sub-Form */}
              {isAddComponentOpen && isDraft && (
                <form onSubmit={handleAddComponentSubmit} className="card" style={{ padding: '14px', background: 'var(--neutral-50)', borderColor: 'var(--primary-300)' }}>
                  <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--primary-800)' }}>
                    Add New Component Item to Master BOM
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <FormField label="Component Item *" required>
                      <Select
                        value={newCompItem}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCompItem(val);
                          const sel = allActiveItems.find(i => i._id === val);
                          if (sel && sel.inventoryUom) {
                            setNewCompUom(typeof sel.inventoryUom === 'object' ? sel.inventoryUom._id : sel.inventoryUom);
                          }
                        }}
                        required
                      >
                        <option value="">-- Select Component Item --</option>
                        {allActiveItems
                          .filter(it => it._id !== (typeof bom.parentItem === 'object' ? bom.parentItem?._id : bom.parentItem))
                          .map(it => (
                            <option key={it._id} value={it._id}>
                              {it.itemCode} — {it.itemName}
                            </option>
                          ))}
                      </Select>
                    </FormField>

                    <FormField label="Qty / Parent *" required>
                      <Input
                        type="number"
                        step="0.000001"
                        min="0.000001"
                        value={newCompQty}
                        onChange={(e) => setNewCompQty(e.target.value)}
                        required
                      />
                    </FormField>

                    <FormField label="UOM *" required>
                      <Select
                        value={newCompUom}
                        onChange={(e) => setNewCompUom(e.target.value)}
                        required
                      >
                        <option value="">-- Select UOM --</option>
                        {allActiveUoms.map(u => (
                          <option key={u._id} value={u._id}>
                            {u.unitSymbol || u.unitName}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField label="Position / Tag">
                      <Input
                        placeholder="e.g. POS-01"
                        value={newCompPos}
                        onChange={(e) => setNewCompPos(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '10px', marginBottom: '10px' }}>
                    <FormField label="Est. Price (₹)">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newCompPrice}
                        onChange={(e) => setNewCompPrice(e.target.value)}
                      />
                    </FormField>

                    <FormField label="Sequence">
                      <Input
                        type="number"
                        value={newCompSeq}
                        onChange={(e) => setNewCompSeq(e.target.value)}
                      />
                    </FormField>

                    <FormField label="Remarks">
                      <Input
                        placeholder="Component instructions..."
                        value={newCompRemarks}
                        onChange={(e) => setNewCompRemarks(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddComponentOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                      Add Component Row
                    </Button>
                  </div>
                </form>
              )}

              {/* Component Items Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--neutral-100)', textTransform: 'uppercase', fontSize: '10.5px', color: 'var(--neutral-600)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', width: '40px' }}>Seq</th>
                      <th style={{ padding: '8px 12px' }}>Component Item</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty / Parent</th>
                      <th style={{ padding: '8px 12px' }}>UOM</th>
                      <th style={{ padding: '8px 12px' }}>Position / Tag</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price (₹)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Est. Total (₹)</th>
                      <th style={{ padding: '8px 12px' }}>Remarks</th>
                      {isDraft && canEdit && <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: 'var(--neutral-500)' }}>
                          No component items added to this Master BOM yet.
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => {
                        const lineTotal = (it.quantityPerParent || 0) * (it.price || 0);
                        return (
                          <tr key={it._id || idx} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--neutral-500)', fontSize: '11.5px' }}>
                              {it.sequence !== undefined ? it.sequence : idx + 1}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                                {it.componentItem?.itemName || 'N/A'}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }} className="font-mono">
                                Code: {it.componentItem?.itemCode || '-'}
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                              {it.quantityPerParent}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--neutral-700)' }}>
                              {typeof it.uom === 'object' ? it.uom?.unitSymbol || it.uom?.unitName : 'Units'}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--neutral-600)' }} className="font-mono">
                              {it.positionTagNo || '-'}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              ₹{(it.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                              ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--neutral-500)', fontSize: '11.5px' }}>
                              {it.remarks || '-'}
                            </td>
                            {isDraft && canEdit && (
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleDeleteComponent(it._id)}
                                  disabled={actionLoading}
                                  style={{ color: 'var(--danger-600)' }}
                                  title="Remove Component"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: REVISION HISTORY */}
          {activeTab === 'revisions' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--neutral-800)', textTransform: 'uppercase' }}>
                  All Versions & Revisions for {bom.parentItem?.itemName || 'Parent Item'}
                </h4>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--neutral-100)', textTransform: 'uppercase', fontSize: '10.5px', color: 'var(--neutral-600)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Version</th>
                    <th style={{ padding: '8px 12px' }}>BOM Code</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                    <th style={{ padding: '8px 12px' }}>Description</th>
                    <th style={{ padding: '8px 12px' }}>Effective From</th>
                    <th style={{ padding: '8px 12px' }}>Effective To</th>
                    <th style={{ padding: '8px 12px' }}>Released At</th>
                  </tr>
                </thead>
                <tbody>
                  {revisions.map((rev) => (
                    <tr
                      key={rev._id}
                      style={{
                        borderBottom: '1px solid var(--neutral-100)',
                        background: rev._id === bom._id ? 'var(--primary-50)' : 'white'
                      }}
                    >
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>v{rev.version}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }} className="font-mono">
                        {rev.bomCode}
                        {rev._id === bom._id && (
                          <span style={{ fontSize: '11px', color: 'var(--primary-700)', marginLeft: '6px' }}>
                            (Current)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <StatusBadge status={rev.status} />
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--neutral-700)' }}>
                        {rev.description || '-'}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {rev.effectiveFrom ? new Date(rev.effectiveFrom).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {rev.effectiveTo ? new Date(rev.effectiveTo).toLocaleDateString('en-GB') : 'Present'}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--neutral-500)' }}>
                        {rev.releasedAt ? new Date(rev.releasedAt).toLocaleDateString('en-GB') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--neutral-200)' }}>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Copy / Revision Modal Trigger */}
      {isCopyOpen && bom && (
        <MasterBOMCopyModal
          isOpen={isCopyOpen}
          bom={bom}
          onClose={() => setIsCopyOpen(false)}
          onSuccess={() => {
            setIsCopyOpen(false);
            if (onBOMUpdated) onBOMUpdated();
            fetchBOMData();
          }}
        />
      )}

      {/* Edit Header Modal Trigger */}
      {isEditHeaderOpen && bom && (
        <MasterBOMFormModal
          isOpen={isEditHeaderOpen}
          bom={bom}
          onClose={() => setIsEditHeaderOpen(false)}
          onSuccess={() => {
            setIsEditHeaderOpen(false);
            if (onBOMUpdated) onBOMUpdated();
            fetchBOMData();
          }}
        />
      )}
    </Modal>
  );
};

export default MasterBOMDetailModal;
