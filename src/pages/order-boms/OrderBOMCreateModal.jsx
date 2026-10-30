import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Select, Textarea } from '../../components/ui/FormField';
import { useGetSalesOrdersQuery, useGetSalesOrderByIdQuery } from '../../features/salesOrders/salesOrdersApi';
import { useGetMasterBOMsQuery, useGetMasterBOMByIdQuery, useCreateOrderBOMMutation } from '../../features/boms/bomsApi';
import { useGetStoresQuery } from '../../features/stores/storesApi';
import { useGetPlantsQuery } from '../../features/masterData/masterDataApi';
import { Layers, Package, ShoppingCart, CheckCircle2, AlertTriangle, FileCheck } from 'lucide-react';

const OrderBOMCreateModal = ({ isOpen, onClose, onSuccess }) => {
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
  const [soItems, setSoItems] = useState([]);
  const [error, setError] = useState('');

  // RTK Query Hooks
  const { data: soListData, isLoading: loadingOrders } = useGetSalesOrdersQuery(
    { limit: 100 },
    { skip: !isOpen }
  );

  const { data: storeListData } = useGetStoresQuery(
    { status: 'active' },
    { skip: !isOpen }
  );

  const { data: plantListData } = useGetPlantsQuery(
    { status: 'active' },
    { skip: !isOpen }
  );

  const { data: selectedSOData, isLoading: loadingSOItems } = useGetSalesOrderByIdQuery(
    selectedSOId,
    { skip: !selectedSOId || !isOpen }
  );

  const parentItemId = selectedSOItem?.item?._id || selectedSOItem?.item || '';

  const { data: releasedBOMsData, isLoading: loadingBOMs } = useGetMasterBOMsQuery(
    { parentItem: parentItemId, status: 'released' },
    { skip: !parentItemId || !isOpen }
  );

  const { data: previewBOMData } = useGetMasterBOMByIdQuery(
    selectedMasterBOMId,
    { skip: !selectedMasterBOMId || !isOpen }
  );

  const [createOrderBOM, { isLoading: submitting }] = useCreateOrderBOMMutation();

  const salesOrders = (soListData?.salesOrders || []).filter(
    (s) => s.status !== 'cancelled' && s.status !== 'draft'
  );
  const stores = storeListData?.stores || [];
  const plants = plantListData?.plants || [];
  const releasedBOMs = releasedBOMsData?.boms || [];
  const previewBOM = previewBOMData || null;

  // 1. Initial reset on open
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
    setSelectedSOObj(null);
    setSelectedSOItem(null);
  }, [isOpen]);

  // 2. When Sales Order data arrives, set items
  useEffect(() => {
    if (!selectedSOId) {
      setSoItems([]);
      setSelectedSOItemId('');
      setSelectedSOObj(null);
      setSelectedSOItem(null);
      setSelectedMasterBOMId('');
      return;
    }

    if (selectedSOData?.success && selectedSOData.salesOrder) {
      setSelectedSOObj(selectedSOData.salesOrder);
      const itemsList = selectedSOData.salesOrder.items || selectedSOData.items || [];
      setSoItems(itemsList);
      setSelectedSOItemId('');
      setSelectedSOItem(null);
      setSelectedMasterBOMId('');
    }
  }, [selectedSOId, selectedSOData]);

  // 3. When Sales Order Item changes, resolve selectedSOItem and auto-select released Master BOM
  useEffect(() => {
    if (!selectedSOItemId) {
      setSelectedSOItem(null);
      setSelectedMasterBOMId('');
      return;
    }

    const itemObj = soItems.find((i) => i._id === selectedSOItemId);
    setSelectedSOItem(itemObj || null);
  }, [selectedSOItemId, soItems]);

  useEffect(() => {
    if (releasedBOMs.length > 0) {
      setSelectedMasterBOMId(releasedBOMs[0]._id);
    } else if (parentItemId) {
      setSelectedMasterBOMId('');
    }
  }, [releasedBOMs, parentItemId]);

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
      const res = await createOrderBOM(payload).unwrap();
      if (res.success || res.orderBOM) {
        onSuccess(res.orderBOM || res);
      } else {
        setError(res.message || 'Failed to create Order BOM');
      }
    } catch (err) {
      console.error('Create Order BOM error:', err);
      if (err.status === 409 || err.originalStatus === 409) {
        setError(err.data?.message || 'An active Order BOM already exists for this Sales Order item.');
      } else {
        setError(err.data?.message || 'Server error creating Order BOM');
      }
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
                <div className="text-xs text-slate-500 font-mono">
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
            <div className="overflow-x-auto border border-slate-200 rounded bg-white" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <table className="w-full border-collapse text-left text-[13px] whitespace-nowrap">
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
