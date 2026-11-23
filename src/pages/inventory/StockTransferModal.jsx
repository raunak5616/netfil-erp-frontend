import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { useTransferStockMutation } from '../../features/inventory/inventoryApi';
import { useGetProductsQuery } from '../../features/products/productsApi';
import { useGetPlantsQuery } from '../../features/masterData/masterDataApi';
import { useGetStoresQuery } from '../../features/stores/storesApi';
import { ArrowRight, RefreshCw } from 'lucide-react';

const StockTransferModal = ({ isOpen, onClose, preselectedStock = null }) => {
  const [transferStock, { isLoading: submitting }] = useTransferStockMutation();
  const { data: prodData } = useGetProductsQuery({ all: true });
  const { data: plantData } = useGetPlantsQuery({ status: 'active' });
  const { data: storeData } = useGetStoresQuery();

  const [itemId, setItemId] = useState('');
  const [uomId, setUomId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  // Source (From)
  const [fromPlant, setFromPlant] = useState('');
  const [fromStore, setFromStore] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [fromBin, setFromBin] = useState('');

  // Destination (To)
  const [toPlant, setToPlant] = useState('');
  const [toStore, setToStore] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [toBin, setToBin] = useState('');

  const items = prodData?.items || prodData?.products || [];
  const plants = plantData?.plants || [];
  const stores = storeData?.stores || [];

  // Pre-fill if opened from a specific stock row
  useEffect(() => {
    if (preselectedStock && isOpen) {
      setItemId(preselectedStock.item?._id || preselectedStock.item || '');
      setUomId(preselectedStock.uom?._id || preselectedStock.uom || '');
      setFromPlant(preselectedStock.plant?._id || preselectedStock.plant || '');
      setFromStore(preselectedStock.store?._id || preselectedStock.store || '');
      setFromLocation(preselectedStock.storageLocation?._id || preselectedStock.storageLocation || '');
      setFromBin(preselectedStock.bin?._id || preselectedStock.bin || '');
      setQuantity('');
      setRemarks('');
      setError('');
    } else if (isOpen) {
      setError('');
    }
  }, [preselectedStock, isOpen]);

  // Handle source store selection to populate storage locations and bins
  const fromStoreObj = stores.find((s) => s._id === fromStore);
  const fromLocations = fromStoreObj?.storageLocations || [];
  const fromLocationObj = fromLocations.find((l) => l._id === fromLocation);
  const fromBins = fromLocationObj?.bins || [];

  // Handle destination store selection to populate storage locations and bins
  const toStoreObj = stores.find((s) => s._id === toStore);
  const toLocations = toStoreObj?.storageLocations || [];
  const toLocationObj = toLocations.find((l) => l._id === toLocation);
  const toBins = toLocationObj?.bins || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!itemId) {
      setError('Please select an item');
      return;
    }
    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (!fromBin || !toBin) {
      setError('Both source Bin and destination Bin are required');
      return;
    }
    if (fromBin === toBin) {
      setError('Source and destination bins cannot be the same');
      return;
    }

    try {
      const payload = {
        item: itemId,
        uom: uomId,
        quantity: numQty,
        remarks: remarks.trim() || 'Inter-Bin Stock Transfer',
        from: {
          plant: fromPlant,
          store: fromStore,
          storageLocation: fromLocation,
          bin: fromBin,
        },
        to: {
          plant: toPlant,
          store: toStore,
          storageLocation: toLocation,
          bin: toBin,
        },
      };

      await transferStock(payload).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to transfer stock');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inter-Bin Stock Transfer"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={submitting}
            icon={ArrowRight}
          >
            Execute Transfer
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Item Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <FormField label="Transfer Quantity" required>
            <Input
              type="number"
              min="0.001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter transfer quantity"
              required
            />
          </FormField>
        </div>

        {/* Source vs Destination Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          {/* Source Location */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 text-sm border-b pb-1">
              Source Location (From)
            </h4>
            <FormField label="Plant" required>
              <Select
                value={fromPlant}
                onChange={(e) => setFromPlant(e.target.value)}
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
                value={fromStore}
                onChange={(e) => {
                  setFromStore(e.target.value);
                  setFromLocation('');
                  setFromBin('');
                }}
                disabled={!!preselectedStock}
              >
                <option value="">Select Store</option>
                {stores
                  .filter((s) => !fromPlant || s.plant?._id === fromPlant || s.plant === fromPlant)
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.storeCode} - {s.storeName}
                    </option>
                  ))}
              </Select>
            </FormField>

            <FormField label="Storage Location" required>
              <Select
                value={fromLocation}
                onChange={(e) => {
                  setFromLocation(e.target.value);
                  setFromBin('');
                }}
                disabled={!!preselectedStock}
              >
                <option value="">Select Location</option>
                {fromLocations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.locationCode} - {loc.locationName}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Bin" required>
              <Select
                value={fromBin}
                onChange={(e) => setFromBin(e.target.value)}
                disabled={!!preselectedStock}
              >
                <option value="">Select Bin</option>
                {fromBins.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.binCode} - {b.binName}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Destination Location */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 text-sm border-b pb-1">
              Destination Location (To)
            </h4>
            <FormField label="Plant" required>
              <Select value={toPlant} onChange={(e) => setToPlant(e.target.value)}>
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
                value={toStore}
                onChange={(e) => {
                  setToStore(e.target.value);
                  setToLocation('');
                  setToBin('');
                }}
              >
                <option value="">Select Store</option>
                {stores
                  .filter((s) => !toPlant || s.plant?._id === toPlant || s.plant === toPlant)
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.storeCode} - {s.storeName}
                    </option>
                  ))}
              </Select>
            </FormField>

            <FormField label="Storage Location" required>
              <Select
                value={toLocation}
                onChange={(e) => {
                  setToLocation(e.target.value);
                  setToBin('');
                }}
              >
                <option value="">Select Location</option>
                {toLocations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.locationCode} - {loc.locationName}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Bin" required>
              <Select value={toBin} onChange={(e) => setToBin(e.target.value)}>
                <option value="">Select Bin</option>
                {toBins.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.binCode} - {b.binName}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>

        <FormField label="Transfer Reason / Remarks">
          <Textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Reason for stock movement..."
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default StockTransferModal;
