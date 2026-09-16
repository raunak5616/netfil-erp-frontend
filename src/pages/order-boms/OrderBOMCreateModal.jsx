import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Select, Textarea } from '../../components/ui/FormField';
import { getSalesOrders, getSalesOrderById } from '../../services/salesOrderService';
import { getBOMs, getBOMById } from '../../services/masterBomService';
import { getStores } from '../../services/storeService';
import { getPlants } from '../../services/plantService';
import { createOrderBOM } from '../../services/orderBomService';
import { Layers, Package, ShoppingCart, CheckCircle2, AlertTriangle, FileCheck } from 'lucide-react';

const OrderBOMCreateModal = ({ isOpen, onClose, onSuccess }) => {
  // Option lists
  const [salesOrders, setSalesOrders] = useState([]);
  const [soItems, setSoItems] = useState([]);
  const [releasedBOMs, setReleasedBOMs] = useState([]);
  const [stores, setStores] = useState([]);
  const [plants, setPlants] = useState([]);

  // Form selections
  const [selectedSOId, setSelectedSOId] = useState('');
  const [selectedSOItemId, setSelectedSOItemId] = useState('');
  const [selectedMasterBOMId, setSelectedMasterBOMId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [remarks, setRemarks] = useState('');

  // Loaded objects for display/preview
  const [selectedSOObj, setSelectedSOObj] = useState(null);
  const [selectedSOItem, setSelectedSOItem] = useState(null);
  const [previewBOM, setPreviewBOM] = useState(null);

  // Statuses & Loading
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSOItems, setLoadingSOItems] = useState(false);
  const [loadingBOMs, setLoadingBOMs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Initial load of sales orders, stores, and plants
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSelectedSOId('');
    setSelectedSOItemId('');
    setSelectedMasterBOMId('');
    setSelectedStoreId('');
    setSelectedPlantId('');
    setRemarks('');
    setSoItems([]);
    setReleasedBOMs([]);
    setSelectedSOObj(null);
    setSelectedSOItem(null);
    setPreviewBOM(null);

    setLoadingOrders(true);
    Promise.all([
      getSalesOrders({ limit: 100 }),
      getStores({ status: 'active' }).catch(() => ({ stores: [] })),
      getPlants({ status: 'active' }).catch(() => ({ plants: [] }))
    ])
      .then(([soRes, storeRes, plantRes]) => {
        if (soRes.success && Array.isArray(soRes.salesOrders)) {
          // Filter active sales orders (confirmed or in_progress or approved)
          const eligible = soRes.salesOrders.filter((s) => s.status !== 'cancelled' && s.status !== 'draft');
          setSalesOrders(eligible.length > 0 ? eligible : soRes.salesOrders);
        }
        if (storeRes.success && Array.isArray(storeRes.stores)) {
          setStores(storeRes.stores);
        }
        if (plantRes.success && Array.isArray(plantRes.plants)) {
          setPlants(plantRes.plants);
        }
      })
      .catch((err) => {
        console.error('Failed to load sales orders:', err);
        setError('Failed to load Sales Orders from server');
      })
      .finally(() => setLoadingOrders(false));
  }, [isOpen]);

  // 2. When Sales Order selection changes, fetch its line items
  useEffect(() => {
    if (!selectedSOId) {
      setSoItems([]);
      setSelectedSOItemId('');
      setSelectedSOObj(null);
      setSelectedSOItem(null);
      setReleasedBOMs([]);
      setSelectedMasterBOMId('');
      setPreviewBOM(null);
      return;
    }

    setLoadingSOItems(true);
    setError('');
    getSalesOrderById(selectedSOId)
      .then((res) => {
        if (res.success && res.salesOrder) {
          setSelectedSOObj(res.salesOrder);
          const itemsList = res.salesOrder.items || res.items || [];
          setSoItems(itemsList);
          setSelectedSOItemId('');
          setSelectedSOItem(null);
          setReleasedBOMs([]);
          setSelectedMasterBOMId('');
          setPreviewBOM(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load Sales Order Items:', err);
        setError(err.response?.data?.message || 'Failed to load items for selected Sales Order');
      })
      .finally(() => setLoadingSOItems(false));
  }, [selectedSOId]);

  // 3. When Sales Order Item changes, resolve parent item & released Master BOMs
  useEffect(() => {
    if (!selectedSOItemId) {
      setSelectedSOItem(null);
      setReleasedBOMs([]);
      setSelectedMasterBOMId('');
      setPreviewBOM(null);
      return;
    }

    const itemObj = soItems.find((i) => i._id === selectedSOItemId);
    setSelectedSOItem(itemObj || null);

    const parentItemId = itemObj?.item?._id || itemObj?.item;
    if (!parentItemId) {
      setError('Selected Sales Order Item has no associated parent Item ID');
      setReleasedBOMs([]);
      setSelectedMasterBOMId('');
      setPreviewBOM(null);
      return;
    }

    setLoadingBOMs(true);
    setError('');
    getBOMs({ parentItem: parentItemId, status: 'released' })
      .then((res) => {
        if (res.success && Array.isArray(res.boms)) {
          setReleasedBOMs(res.boms);
          if (res.boms.length > 0) {
            // Auto-select latest released Master BOM
            setSelectedMasterBOMId(res.boms[0]._id);
          } else {
            setSelectedMasterBOMId('');
            setPreviewBOM(null);
            setError('No released Master BOM found for this finished item. A released Master BOM is required to create an Order BOM.');
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load released Master BOMs:', err);
        setError(err.response?.data?.message || 'Error fetching Master BOM for item');
      })
      .finally(() => setLoadingBOMs(false));
  }, [selectedSOItemId, soItems]);

  // 4. When selected Master BOM changes, fetch preview component items
  useEffect(() => {
    if (!selectedMasterBOMId) {
      setPreviewBOM(null);
      return;
    }

    getBOMById(selectedMasterBOMId)
      .then((res) => {
        if (res.success && res.bom) {
          setPreviewBOM(res);
        } else if (res.success) {
          setPreviewBOM(res);
        }
      })
      .catch((err) => {
        console.error('Failed to load Master BOM preview details:', err);
      });
  }, [selectedMasterBOMId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSOId) {
      setError('Please select a Sales Order');
      return;
    }
    if (!selectedSOItemId) {
      setError('Please select a Sales Order Item');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      salesOrderId: selectedSOId,
      salesOrderItemId: selectedSOItemId,
      masterBOMId: selectedMasterBOMId || undefined,
      storeId: selectedStoreId || undefined,
      plantId: selectedPlantId || undefined,
      remarks: remarks.trim()
    };

    try {
      const res = await createOrderBOM(payload);
      if (res.success) {
        onSuccess(res.orderBOM);
      } else {
        setError(res.message || 'Failed to create Order BOM');
      }
    } catch (err) {
      console.error('Create Order BOM error:', err);
      if (err.response?.status === 409) {
        setError(err.response?.data?.message || 'An active Order BOM already exists for this Sales Order item.');
      } else {
        setError(err.response?.data?.message || 'Server error creating Order BOM');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const orderQty = selectedSOItem?.quantity || 0;
  const uomName = selectedSOItem?.uom?.uomCode || selectedSOItem?.uom?.uomName || 'Nos';
  const selectedBOMObj = releasedBOMs.find((b) => b._id === selectedMasterBOMId) || previewBOM?.bom;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Order-Specific BOM (Order BOM)"
      maxWidth="820px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || !selectedSOId || !selectedSOItemId || loadingOrders || loadingSOItems || loadingBOMs}
          >
            {submitting ? 'Creating Order BOM...' : 'Create Order BOM'}
          </Button>
        </>
      }
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '12.5px', color: 'var(--neutral-600)', background: 'var(--neutral-50)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
          Order BOM generates an <strong>order-specific snapshot</strong> of a released Master BOM for a confirmed Sales Order line item. It serves as a document record for Store and Factory routing.
        </div>

        {/* Form Inputs Grid */}
        <div className="form-grid">
          {/* Step 1: Sales Order */}
          <FormField label="1. Select Sales Order" required>
            <Select
              value={selectedSOId}
              onChange={(e) => setSelectedSOId(e.target.value)}
              disabled={loadingOrders || submitting}
              required
            >
              <option value="">-- Select Sales Order --</option>
              {salesOrders.map((so) => (
                <option key={so._id} value={so._id}>
                  {so.salesOrderNo} — {so.client?.companyName || so.client?.clientCode || 'Party'} ({so.status})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Step 2: Sales Order Item */}
          <FormField label="2. Select Sales Order Item" required>
            <Select
              value={selectedSOItemId}
              onChange={(e) => setSelectedSOItemId(e.target.value)}
              disabled={!selectedSOId || loadingSOItems || submitting}
              required
            >
              <option value="">
                {loadingSOItems ? 'Loading items...' : '-- Select Sales Order Item --'}
              </option>
              {soItems.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.item?.itemCode || 'Item'} — {item.item?.itemName || item.description} (Qty: {item.quantity} {item.uom?.uomCode || ''})
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Step 3: Selected Item & Master BOM Selection */}
        {selectedSOItem && (
          <div style={{ background: '#fff', border: '1px solid var(--neutral-300)', borderRadius: '6px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700 }}>
                  Selected Parent Finished Product
                </span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                  {selectedSOItem.item?.itemName || selectedSOItem.description}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--neutral-500)' }} className="font-mono">
                  Code: {selectedSOItem.item?.itemCode || 'N/A'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700 }}>
                  Order Quantity
                </span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-700)' }}>
                  {orderQty} {uomName}
                </div>
              </div>
            </div>

            <FormField label="3. Released Master BOM" required>
              <Select
                value={selectedMasterBOMId}
                onChange={(e) => setSelectedMasterBOMId(e.target.value)}
                disabled={loadingBOMs || releasedBOMs.length === 0 || submitting}
                required
              >
                {releasedBOMs.length === 0 ? (
                  <option value="">No released Master BOM available</option>
                ) : (
                  releasedBOMs.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bomCode} (Version {b.version}) — Released
                    </option>
                  ))
                )}
              </Select>
            </FormField>
          </div>
        )}

        {/* Compact Pre-creation Summary Card */}
        {selectedSOObj && selectedSOItem && (
          <div style={{ background: 'var(--primary-50, #f0f7ff)', border: '1px solid var(--primary-200, #bae0ff)', borderRadius: '6px', padding: '12px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-900)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck size={14} /> Order BOM Generation Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12.5px' }}>
              <div>
                <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Sales Order:</span>
                <strong style={{ color: 'var(--neutral-900)' }}>{selectedSOObj.salesOrderNo}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Parent Item:</span>
                <strong style={{ color: 'var(--neutral-900)' }}>{selectedSOItem.item?.itemName || 'Product'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Order Quantity:</span>
                <strong style={{ color: 'var(--primary-700)' }}>{orderQty} {uomName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Master BOM:</span>
                <strong style={{ color: 'var(--neutral-900)' }}>
                  {selectedBOMObj?.bomCode || 'BOM Source'} (v{selectedBOMObj?.version || '1'})
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Component Snapshot Preview Table */}
        {previewBOM && previewBOM.items && previewBOM.items.length > 0 && (
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: '6px' }}>
              Component Snapshot Preview (Calculated for {orderQty} {uomName})
            </div>
            <div className="table-container" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Component Item</th>
                    <th style={{ textAlign: 'right' }}>Qty / Parent</th>
                    <th style={{ textAlign: 'right' }}>Total Required Qty</th>
                    <th>UOM</th>
                    <th>Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {previewBOM.items.map((cItem, idx) => {
                    const qtyPerParent = Number(cItem.quantityPerParent || 0);
                    const totalRequired = Number((qtyPerParent * orderQty).toFixed(6));
                    return (
                      <tr key={cItem._id || idx}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{cItem.componentItem?.itemName || 'Component'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }} className="font-mono">
                            {cItem.componentItem?.itemCode || 'N/A'}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{qtyPerParent}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-700)' }}>
                          {totalRequired}
                        </td>
                        <td>{cItem.uom?.uomCode || cItem.uom?.uomName || '-'}</td>
                        <td>{cItem.positionTag || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 5: Optional Store / Plant Assignment & Remarks */}
        <div className="form-grid">
          <FormField label="Initial Store Assignment (Optional)">
            <Select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              disabled={submitting}
            >
              <option value="">-- Unassigned --</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.storeCode} — {s.storeName}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Target Factory Plant (Optional)">
            <Select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              disabled={submitting}
            >
              <option value="">-- Unassigned --</option>
              {plants.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.plantCode} — {p.plantName}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Remarks / Manufacturing Notes" className="full-width">
            <Textarea
              rows={2}
              placeholder="Add order-specific manufacturing notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={submitting}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
};

export default OrderBOMCreateModal;
