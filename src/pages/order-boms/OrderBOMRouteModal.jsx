import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Select, Textarea } from '../../components/ui/FormField';
import { getStores } from '../../services/storeService';
import { getPlants } from '../../services/plantService';
import {
  sendToStore,
  receiveByStore,
  sendToFactory,
  receiveByFactory,
  cancelOrderBOM
} from '../../services/orderBomService';

const OrderBOMRouteModal = ({ isOpen, actionType, orderBOM, onClose, onSuccess }) => {
  const [stores, setStores] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !actionType) return;
    setError('');
    setRemarks('');
    setSelectedStoreId(orderBOM?.store?._id || orderBOM?.store || '');
    setSelectedPlantId(orderBOM?.plant?._id || orderBOM?.plant || '');

    if (actionType === 'SEND_TO_STORE') {
      setLoadingOptions(true);
      getStores({ status: 'active' })
        .then((res) => {
          if (res.success && Array.isArray(res.stores)) {
            setStores(res.stores);
            if (!selectedStoreId && res.stores.length > 0) {
              setSelectedStoreId(res.stores[0]._id);
            }
          }
        })
        .catch((err) => {
          console.warn('Could not load stores:', err);
        })
        .finally(() => setLoadingOptions(false));
    } else if (actionType === 'SEND_TO_FACTORY') {
      setLoadingOptions(true);
      getPlants({ status: 'active' })
        .then((res) => {
          if (res.success && Array.isArray(res.plants)) {
            setPlants(res.plants);
            if (!selectedPlantId && res.plants.length > 0) {
              setSelectedPlantId(res.plants[0]._id);
            }
          }
        })
        .catch((err) => {
          console.warn('Could not load plants:', err);
        })
        .finally(() => setLoadingOptions(false));
    }
  }, [isOpen, actionType, orderBOM]);

  const getModalConfig = () => {
    switch (actionType) {
      case 'SEND_TO_STORE':
        return {
          title: `Send Order BOM ${orderBOM?.orderBOMCode || ''} to Store`,
          submitText: 'Send to Store',
          variant: 'primary',
          confirmMsg: 'Send this Order BOM document to Store?'
        };
      case 'RECEIVE_BY_STORE':
        return {
          title: `Receive Order BOM ${orderBOM?.orderBOMCode || ''} in Store`,
          submitText: 'Acknowledge Receipt in Store',
          variant: 'primary',
          confirmMsg: 'Confirm store receipt of Order BOM document?'
        };
      case 'SEND_TO_FACTORY':
        return {
          title: `Send Order BOM ${orderBOM?.orderBOMCode || ''} to Factory`,
          submitText: 'Send to Factory',
          variant: 'primary',
          confirmMsg: 'Send this Order BOM document to Factory?'
        };
      case 'RECEIVE_BY_FACTORY':
        return {
          title: `Receive Order BOM ${orderBOM?.orderBOMCode || ''} in Factory`,
          submitText: 'Acknowledge Receipt in Factory',
          variant: 'primary',
          confirmMsg: 'Confirm factory receipt of Order BOM document?'
        };
      case 'CANCEL':
        return {
          title: `Cancel Order BOM ${orderBOM?.orderBOMCode || ''}`,
          submitText: 'Confirm Cancellation',
          variant: 'danger',
          confirmMsg: 'Are you sure you want to cancel this Order BOM?'
        };
      default:
        return {
          title: 'Order BOM Action',
          submitText: 'Submit',
          variant: 'primary',
          confirmMsg: ''
        };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderBOM?._id) return;
    setError('');

    if (actionType === 'SEND_TO_STORE' && !selectedStoreId) {
      setError('Please select a target Store');
      return;
    }

    if (actionType === 'SEND_TO_FACTORY' && !selectedPlantId) {
      setError('Please select a target Factory (Plant)');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (actionType === 'SEND_TO_STORE') {
        res = await sendToStore(orderBOM._id, { storeId: selectedStoreId, remarks });
      } else if (actionType === 'RECEIVE_BY_STORE') {
        res = await receiveByStore(orderBOM._id, { remarks });
      } else if (actionType === 'SEND_TO_FACTORY') {
        res = await sendToFactory(orderBOM._id, { plantId: selectedPlantId, remarks });
      } else if (actionType === 'RECEIVE_BY_FACTORY') {
        res = await receiveByFactory(orderBOM._id, { remarks });
      } else if (actionType === 'CANCEL') {
        res = await cancelOrderBOM(orderBOM._id, { remarks });
      }

      if (res && res.success) {
        onSuccess(res.orderBOM || res.message);
      } else {
        setError(res?.message || 'Failed to complete routing action');
      }
    } catch (err) {
      console.error('Order BOM routing error:', err);
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
          <Button variant={config.variant} onClick={handleSubmit} disabled={loading || loadingOptions}>
            {loading ? 'Processing...' : config.submitText}
          </Button>
        </>
      }
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>{config.confirmMsg}</p>

        {actionType === 'SEND_TO_STORE' && (
          <FormField label="Target Store" required error={!selectedStoreId && error ? 'Store selection is required' : ''}>
            <Select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              disabled={loadingOptions || loading}
              required
            >
              <option value="">-- Select Store --</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.storeCode} — {s.storeName}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {actionType === 'SEND_TO_FACTORY' && (
          <FormField label="Target Factory (Plant)" required error={!selectedPlantId && error ? 'Factory selection is required' : ''}>
            <Select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              disabled={loadingOptions || loading}
              required
            >
              <option value="">-- Select Factory / Plant --</option>
              {plants.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.plantCode} — {p.plantName}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <FormField label="Remarks / Notes">
          <Textarea
            rows={3}
            placeholder="Add handover or routing comments..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={loading}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default OrderBOMRouteModal;
