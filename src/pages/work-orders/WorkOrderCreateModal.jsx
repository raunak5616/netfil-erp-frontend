import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Select, Input, Textarea } from '../../components/ui/FormField';
import { useGetOrderBOMsQuery, useGetOrderBOMByIdQuery } from '../../features/boms/bomsApi';
import { useGetPlantsQuery } from '../../features/masterData/masterDataApi';
import { useCreateWorkOrderMutation } from '../../features/workOrders/workOrdersApi';
import { FileCheck, Wrench } from 'lucide-react';

const WorkOrderCreateModal = ({ isOpen, initialOrderBOM = null, onClose, onSuccess }) => {
  // Selections & Form fields
  const [selectedOrderBOMId, setSelectedOrderBOMId] = useState('');
  const [selectedOrderBOM, setSelectedOrderBOM] = useState(null);
  const [obomComponents, setObomComponents] = useState([]);
  
  const [productionQuantity, setProductionQuantity] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  // RTK Query Hooks
  const { data: obomListData, isLoading: loadingOBOMs } = useGetOrderBOMsQuery(
    { status: 'RECEIVED_BY_FACTORY', limit: 100 },
    { skip: !isOpen }
  );

  const { data: plantListData } = useGetPlantsQuery(
    { status: 'active' },
    { skip: !isOpen }
  );

  const { data: selectedOBOMData, isFetching: loadingDetail } = useGetOrderBOMByIdQuery(
    selectedOrderBOMId,
    { skip: !selectedOrderBOMId || !isOpen }
  );

  const [createWorkOrder, { isLoading: submitting }] = useCreateWorkOrderMutation();

  const orderBOMs = obomListData?.orderBOMs || [];
  const plants = plantListData?.plants || [];

  // 1. Initial reset & populate from initialOrderBOM if provided
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSelectedOrderBOMId(initialOrderBOM?._id || '');
    setSelectedOrderBOM(null);
    setObomComponents([]);
    setProductionQuantity('');
    setSelectedPlantId('');
    setPlannedStartDate('');
    setPlannedEndDate('');
    setRemarks('');
  }, [isOpen, initialOrderBOM]);

  // 2. When selected Order BOM details arrive, populate state
  useEffect(() => {
    if (!selectedOrderBOMId) {
      setSelectedOrderBOM(null);
      setObomComponents([]);
      setProductionQuantity('');
      setSelectedPlantId('');
      return;
    }

    if (selectedOBOMData?.success && selectedOBOMData.orderBOM) {
      const obom = selectedOBOMData.orderBOM;
      setSelectedOrderBOM(obom);
      setObomComponents(selectedOBOMData.items || []);
      setProductionQuantity(obom.orderQuantity || '');
      if (obom.plant?._id || obom.plant) {
        setSelectedPlantId(obom.plant._id || obom.plant);
      }
    }
  }, [selectedOrderBOMId, selectedOBOMData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderBOMId || !selectedOrderBOM) {
      setError('Please select an Order BOM');
      return;
    }

    const qty = Number(productionQuantity);
    if (!productionQuantity || Number.isNaN(qty) || qty <= 0) {
      setError('Production quantity must be a positive number greater than 0');
      return;
    }

    const salesOrderId = selectedOrderBOM.salesOrder?._id || selectedOrderBOM.salesOrder;
    const salesOrderItemId = selectedOrderBOM.salesOrderItem?._id || selectedOrderBOM.salesOrderItem;
    const targetPlantId = selectedPlantId || selectedOrderBOM.plant?._id || selectedOrderBOM.plant;

    if (!targetPlantId) {
      setError('Please select a target Factory Plant');
      return;
    }

    setError('');

    const payload = {
      salesOrderId,
      salesOrderItemId,
      orderBOMId: selectedOrderBOM._id,
      productionQuantity: qty,
      plantId: targetPlantId,
      plannedStartDate: plannedStartDate || undefined,
      plannedEndDate: plannedEndDate || undefined,
      remarks: remarks.trim()
    };

    try {
      const res = await createWorkOrder(payload).unwrap();
      if (res.success || res.workOrder) {
        onSuccess(res.workOrder || res);
      } else {
        setError(res.message || 'Failed to create Work Order');
      }
    } catch (err) {
      console.error('Create Work Order error:', err);
      if (err.status === 409 || err.originalStatus === 409) {
        setError(err.data?.message || `An active Work Order already exists for this Order BOM.`);
      } else {
        setError(err.data?.message || 'Server error creating Work Order');
      }
    }
  };

  const prodQtyNum = Number(productionQuantity) || 0;
  const uomName = selectedOrderBOM?.uom?.uomCode || selectedOrderBOM?.uom?.uomName || 'Nos';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Work Order (Manufacturing Job)"
      maxWidth="840px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || !selectedOrderBOMId || loadingOBOMs || loadingDetail}
          >
            {submitting ? 'Generating Work Order...' : 'Create Work Order'}
          </Button>
        </>
      }
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '12.5px', color: 'var(--neutral-600)', background: 'var(--neutral-50)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
          Work Order generates a <strong>manufacturing job</strong> derived from a routed Order BOM in <code>RECEIVED_BY_FACTORY</code> status. Component requirements will be snapshotted automatically.
        </div>

        {/* Step 1: Select Order BOM */}
        <div className="form-grid">
          <FormField label="1. Select Order BOM (Factory Received)" required className="full-width">
            <Select
              value={selectedOrderBOMId}
              onChange={(e) => setSelectedOrderBOMId(e.target.value)}
              disabled={loadingOBOMs || submitting}
              required
            >
              <option value="">-- Select Factory-Received Order BOM --</option>
              {orderBOMs.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.orderBOMCode} — SO: {b.salesOrder?.salesOrderNo || 'N/A'} ({b.parentItem?.itemName || 'Product'}) [Qty: {b.orderQuantity}]
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Loaded Order BOM Details & Production Inputs */}
        {selectedOrderBOM && (
          <>
            {/* Pre-creation Summary Banner */}
            <div style={{ background: 'var(--primary-50, #f0f7ff)', border: '1px solid var(--primary-200, #bae0ff)', borderRadius: '6px', padding: '12px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-900)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCheck size={14} /> Work Order Pre-Generation Context
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Order BOM:</span>
                  <strong style={{ color: 'var(--neutral-900)' }} className="font-mono">{selectedOrderBOM.orderBOMCode}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Sales Order & Party:</span>
                  <strong style={{ color: 'var(--neutral-900)' }}>{selectedOrderBOM.salesOrder?.salesOrderNo || 'N/A'}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--neutral-600)' }}>
                    {selectedOrderBOM.salesOrder?.client?.companyName || selectedOrderBOM.salesOrder?.client?.clientCode || ''}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Parent Product:</span>
                  <strong style={{ color: 'var(--neutral-900)' }}>{selectedOrderBOM.parentItem?.itemName || 'Finished Item'}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }} className="font-mono">
                    {selectedOrderBOM.parentItem?.itemCode}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Source Master BOM:</span>
                  <strong style={{ color: 'var(--neutral-900)' }}>{selectedOrderBOM.masterBOM?.bomCode || 'BOM'} (v{selectedOrderBOM.masterBOMVersion || 1})</strong>
                </div>
              </div>
            </div>

            {/* Production Parameters Grid */}
            <div className="form-grid">
              <FormField label="Planned Production Quantity" required>
                <Input
                  type="number"
                  step="any"
                  min="0.0001"
                  value={productionQuantity}
                  onChange={(e) => setProductionQuantity(e.target.value)}
                  placeholder="Enter production quantity"
                  disabled={submitting}
                  required
                />
              </FormField>

              <FormField label="Target Plant (Factory)" required>
                <Select
                  value={selectedPlantId}
                  onChange={(e) => setSelectedPlantId(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Select Plant --</option>
                  {plants.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.plantCode} — {p.plantName}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Planned Start Date">
                <Input
                  type="date"
                  value={plannedStartDate}
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                  disabled={submitting}
                />
              </FormField>

              <FormField label="Planned Completion Date">
                <Input
                  type="date"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                  disabled={submitting}
                />
              </FormField>

              <FormField label="Remarks / Production Instructions" className="full-width">
                <Textarea
                  rows={2}
                  placeholder="Add manufacturing instructions or shop floor notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={submitting}
                />
              </FormField>
            </div>

            {/* Component Snapshot Preview Table */}
            {obomComponents.length > 0 && (
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: '6px' }}>
                  Component Requirements Snapshot (Calculated for {prodQtyNum} {uomName})
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded bg-white" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  <table className="w-full border-collapse text-left text-[13px] whitespace-nowrap">
                    <thead>
                      <tr>
                        <th>Component Item</th>
                        <th style={{ textAlign: 'right' }}>Qty / Parent</th>
                        <th style={{ textAlign: 'right' }}>Calculated Required Qty</th>
                        <th>UOM</th>
                        <th>Tag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {obomComponents.map((cItem, idx) => {
                        const qtyPerParent = Number(cItem.quantityPerParent || 0);
                        const calculatedReq = Number((qtyPerParent * prodQtyNum).toFixed(6));
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
                              {calculatedReq}
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
          </>
        )}
      </form>
    </Modal>
  );
};

export default WorkOrderCreateModal;
