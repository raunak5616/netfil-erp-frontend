import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { useAdjustStockMutation } from '../../features/inventory/inventoryApi';
import { useGetProductsQuery } from '../../features/products/productsApi';
import { useGetPlantsQuery } from '../../features/masterData/masterDataApi';
import { useGetStoresQuery } from '../../features/stores/storesApi';
import { SlidersHorizontal } from 'lucide-react';

const StockAdjustmentModal = ({ isOpen, onClose, preselectedStock = null }) => {
  const [adjustStock, { isLoading: submitting }] = useAdjustStockMutation();
  const { data: prodData } = useGetProductsQuery({ all: true });
  const { data: plantData } = useGetPlantsQuery({ status: 'active' });
  const { data: storeData } = useGetStoresQuery();

  const [itemId, setItemId] = useState('');
  const [uomId, setUomId] = useState('');
  const [plantId, setPlantId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [binId, setBinId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('physical_count');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const items = prodData?.items || prodData?.products || [];
  const plants = plantData?.plants || [];
  const stores = storeData?.stores || [];

  useEffect(() => {
    if (preselectedStock && isOpen) {
      setItemId(preselectedStock.item?._id || preselectedStock.item || '');
      setUomId(preselectedStock.uom?._id || preselectedStock.uom || '');
      setPlantId(preselectedStock.plant?._id || preselectedStock.plant || '');
      setStoreId(preselectedStock.store?._id || preselectedStock.store || '');
      setLocationId(preselectedStock.storageLocation?._id || preselectedStock.storageLocation || '');
      setBinId(preselectedStock.bin?._id || preselectedStock.bin || '');
      setQuantity('');
      setRemarks('');
      setError('');
    } else if (isOpen) {
      setError('');
    }
  }, [preselectedStock, isOpen]);

  const selectedStore = stores.find((s) => s._id === storeId);
  const locations = selectedStore?.storageLocations || [];
  const selectedLocation = locations.find((l) => l._id === locationId);
  const bins = selectedLocation?.bins || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!itemId) {
      setError('Please select an item');
      return;
    }
    const numQty = Number(quantity);
    if (Number.isNaN(numQty) || numQty === 0) {
      setError('Adjustment quantity cannot be 0');
      return;
    }
    if (!binId) {
      setError('Please select a Bin location');
      return;
    }

    try {
      const payload = {
        item: itemId,
        uom: uomId,
        plant: plantId,
        store: storeId,
        storageLocation: locationId,
        bin: binId,
        adjustmentType,
        quantity: numQty,
        remarks: remarks.trim() || `Stock Adjustment (${adjustmentType})`,
      };

      await adjustStock(payload).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to adjust stock');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Inventory Adjustment"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={submitting}
            icon={SlidersHorizontal}
          >
            Apply Adjustment
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <FormField label="Item / Material" required>
          <Select
            value={itemId}
            onChange={(e) => {
              const id = e.target.value;
              setItemId(id);
              const sel = items.find((it) => it._id === id);
              if (sel) {
                setUomId(sel.inventoryUom?._id || sel.inventoryUom || '');
              }
            }}
            disabled={!!preselectedStock}
          >
            <option value="">Select Item</option>
            {items.map((it) => (
              <option key={it._id} value={it._id}>
                {it.itemCode} - {it.itemName}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Adjustment Type" required>
            <Select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
            >
              <option value="physical_count">Physical Count Variance</option>
              <option value="damage">Damaged Stock</option>
              <option value="scrap">Scrap Write-Off</option>
              <option value="loss">Stock Loss</option>
              <option value="gain">Stock Gain</option>
              <option value="reconciliation">Audit Reconciliation</option>
            </Select>
          </FormField>

          <FormField label="Quantity (Set New or Delta)" required>
            <Input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50 (physical count)"
              required
            />
          </FormField>
        </div>

        {/* Location selectors */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <FormField label="Plant" required>
            <Select
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              disabled={!!preselectedStock}
            >
              <option value="">Select Plant</option>
              {plants.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.plantCode} - {p.plantName}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Store" required>
            <Select
              value={storeId}
              onChange={(e) => {
                setStoreId(e.target.value);
                setLocationId('');
                setBinId('');
              }}
              disabled={!!preselectedStock}
            >
              <option value="">Select Store</option>
              {stores
                .filter((s) => !plantId || s.plant?._id === plantId || s.plant === plantId)
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.storeCode} - {s.storeName}
                  </option>
                ))}
            </Select>
          </FormField>

          <FormField label="Storage Location" required>
            <Select
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setBinId('');
              }}
              disabled={!!preselectedStock}
            >
              <option value="">Select Location</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.locationCode} - {loc.locationName}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Bin Location" required>
            <Select
              value={binId}
              onChange={(e) => setBinId(e.target.value)}
              disabled={!!preselectedStock}
            >
              <option value="">Select Bin</option>
              {bins.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.binCode} - {b.binName}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Reason & Remarks">
          <Textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Audit notes, reason for discrepancy, etc."
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default StockAdjustmentModal;
