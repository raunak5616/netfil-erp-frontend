import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Select, Input, Textarea } from '../../components/ui/FormField';
import { getPlants } from '../../services/plantService';
import { updateWorkOrder } from '../../services/workOrderService';

const WorkOrderEditModal = ({ isOpen, workOrder, onClose, onSuccess }) => {
  const [plants, setPlants] = useState([]);
  const [productionQuantity, setProductionQuantity] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loadingPlants, setLoadingPlants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !workOrder) return;
    setError('');
    setProductionQuantity(workOrder.productionQuantity || '');
    setSelectedPlantId(workOrder.plant?._id || workOrder.plant || '');
    setPlannedStartDate(workOrder.plannedStartDate ? new Date(workOrder.plannedStartDate).toISOString().split('T')[0] : '');
    setPlannedEndDate(workOrder.plannedEndDate ? new Date(workOrder.plannedEndDate).toISOString().split('T')[0] : '');
    setRemarks(workOrder.remarks || '');

    setLoadingPlants(true);
    getPlants({ status: 'active' })
      .then((res) => {
        if (res.success && Array.isArray(res.plants)) {
          setPlants(res.plants);
        }
      })
      .catch((err) => console.warn('Could not load plants:', err))
      .finally(() => setLoadingPlants(false));
  }, [isOpen, workOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workOrder?._id) return;

    const qty = Number(productionQuantity);
    if (!productionQuantity || Number.isNaN(qty) || qty <= 0) {
      setError('Production quantity must be greater than 0');
      return;
    }

    if (workOrder.status !== 'DRAFT') {
      setError(`Cannot edit Work Order in '${workOrder.status}' status. Only DRAFT Work Orders can be edited.`);
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      productionQuantity: qty,
      plantId: selectedPlantId || undefined,
      plannedStartDate: plannedStartDate || undefined,
      plannedEndDate: plannedEndDate || undefined,
      remarks: remarks.trim()
    };

    try {
      const res = await updateWorkOrder(workOrder._id, payload);
      if (res.success) {
        onSuccess(res.workOrder);
      } else {
        setError(res.message || 'Failed to update Work Order');
      }
    } catch (err) {
      console.error('Update Work Order error:', err);
      setError(err.response?.data?.message || 'Server error updating Work Order');
    } finally {
      setSubmitting(false);
    }
  };

  const uomName = workOrder?.uom?.uomCode || workOrder?.uom?.uomName || 'Nos';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Draft Work Order: ${workOrder?.workOrderNo || ''}`}
      maxWidth="680px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting || loadingPlants}>
            {submitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Fixed Non-Editable Info Banner */}
        <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '12px', fontSize: '12px', color: 'var(--neutral-700)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div>
              <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Order BOM:</span>
              <strong className="font-mono">{workOrder?.orderBOM?.orderBOMCode || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Sales Order:</span>
              <strong>{workOrder?.salesOrder?.salesOrderNo || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Parent Finished Item:</span>
              <strong>{workOrder?.parentItem?.itemName || 'N/A'}</strong>
            </div>
          </div>
        </div>

        {/* Editable Form Inputs */}
        <div className="form-grid">
          <FormField label={`Planned Production Quantity (${uomName})`} required>
            <Input
              type="number"
              step="any"
              min="0.0001"
              value={productionQuantity}
              onChange={(e) => setProductionQuantity(e.target.value)}
              disabled={submitting}
              required
            />
          </FormField>

          <FormField label="Target Plant (Factory)" required>
            <Select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              disabled={loadingPlants || submitting}
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

          <FormField label="Remarks" className="full-width">
            <Textarea
              rows={2}
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

export default WorkOrderEditModal;
