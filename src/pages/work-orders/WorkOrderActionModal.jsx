import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Textarea } from '../../components/ui/FormField';
import {
  releaseWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  cancelWorkOrder
} from '../../services/workOrderService';

const WorkOrderActionModal = ({ isOpen, actionType, workOrder, onClose, onSuccess }) => {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !actionType) return;
    setError('');
    setRemarks('');
  }, [isOpen, actionType, workOrder]);

  const getModalConfig = () => {
    switch (actionType) {
      case 'RELEASE':
        return {
          title: `Release Work Order ${workOrder?.workOrderNo || ''}`,
          submitText: 'Release Work Order',
          variant: 'primary',
          confirmMsg: 'Release this Work Order to the production shop floor?'
        };
      case 'START':
        return {
          title: `Start Work Order ${workOrder?.workOrderNo || ''}`,
          submitText: 'Start Production',
          variant: 'primary',
          confirmMsg: 'Start physical production on this Work Order?'
        };
      case 'COMPLETE':
        return {
          title: `Complete Work Order ${workOrder?.workOrderNo || ''}`,
          submitText: 'Complete Work Order',
          variant: 'primary',
          confirmMsg: 'Mark this Work Order as COMPLETED?'
        };
      case 'CANCEL':
        return {
          title: `Cancel Work Order ${workOrder?.workOrderNo || ''}`,
          submitText: 'Confirm Cancellation',
          variant: 'danger',
          confirmMsg: 'Are you sure you want to cancel this Work Order?'
        };
      default:
        return {
          title: 'Work Order Action',
          submitText: 'Submit',
          variant: 'primary',
          confirmMsg: ''
        };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workOrder?._id) return;
    setError('');
    setLoading(true);

    try {
      let res;
      if (actionType === 'RELEASE') {
        res = await releaseWorkOrder(workOrder._id, { remarks });
      } else if (actionType === 'START') {
        res = await startWorkOrder(workOrder._id, { remarks });
      } else if (actionType === 'COMPLETE') {
        res = await completeWorkOrder(workOrder._id, { remarks });
      } else if (actionType === 'CANCEL') {
        res = await cancelWorkOrder(workOrder._id, { remarks });
      }

      if (res && res.success) {
        onSuccess(res.workOrder || res.message);
      } else {
        setError(res?.message || 'Failed to complete action');
      }
    } catch (err) {
      console.error('Work Order action error:', err);
      setError(err.response?.data?.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  const config = getModalConfig();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={config.variant} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : config.submitText}
          </Button>
        </>
      }
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '13.5px', color: 'var(--neutral-700)' }}>{config.confirmMsg}</p>

        <FormField label="Remarks / Action Comments">
          <Textarea
            rows={3}
            placeholder="Add action notes or shop floor comments..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={loading}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default WorkOrderActionModal;
