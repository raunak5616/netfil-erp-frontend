import React, { useState, useEffect } from 'react';
import { useCreateDeliveryChallanMutation } from '../../features/dispatch/dispatchApi';
import { useGetClientsQuery, useGetPlantsQuery } from '../../features/masterData/masterDataApi';
import { useGetStoresQuery, useGetBinsQuery } from '../../features/stores/storesApi';
import { useGetSalesOrdersQuery } from '../../features/salesOrders/salesOrdersApi';
import { useGetItemsQuery } from '../../features/products/productsApi';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select, Textarea } from '../../components/ui/FormField';
import { X, Plus, Trash2, Truck, Package } from 'lucide-react';

const DeliveryChallanCreateModal = ({ isOpen, onClose, prefillData }) => {
  const [createChallan, { isLoading: isSubmitting }] = useCreateDeliveryChallanMutation();

  const { data: clientsData } = useGetClientsQuery();
  const { data: plantsData } = useGetPlantsQuery();
  const { data: storesData } = useGetStoresQuery();
  const { data: binsData } = useGetBinsQuery();
  const { data: salesOrdersData } = useGetSalesOrdersQuery({ status: 'confirmed' });
  const { data: itemsData } = useGetItemsQuery();

  const clients = clientsData?.data || clientsData || [];
  const plants = plantsData?.data || plantsData || [];
  const stores = storesData?.data || storesData || [];
  const bins = binsData?.data || binsData || [];
  const salesOrders = salesOrdersData?.data || salesOrdersData || [];
  const itemsList = itemsData?.data || itemsData || [];

  const [formData, setFormData] = useState({
    challanNo: 'AUTO',
    challanDate: new Date().toISOString().split('T')[0],
    client: '',
    salesOrder: '',
    plant: '',
    store: '',
    transporterName: '',
    vehicleNo: '',
    lrNo: '',
    modeOfTransport: 'ROAD',
    shippingAddress: {
      addressLine1: '',
      city: '',
      state: '',
      pincode: '',
    },
    remarks: '',
  });

  const [items, setItems] = useState([
    {
      item: '',
      dispatchQuantity: '',
      packageCount: 1,
      bin: '',
      description: '',
      remarks: '',
    },
  ]);

  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (prefillData?.salesOrder) {
      setFormData((prev) => ({
        ...prev,
        salesOrder: prefillData.salesOrder._id || prefillData.salesOrder,
        client: prefillData.salesOrder.client?._id || prefillData.salesOrder.client || prev.client,
      }));
    }
    if (plants.length > 0 && !formData.plant) {
      setFormData((prev) => ({ ...prev, plant: plants[0]._id }));
    }
  }, [prefillData, plants]);

  if (!isOpen) return null;

  const handleClientChange = (clientId) => {
    const selected = clients.find((c) => c._id === clientId);
    setFormData((prev) => ({
      ...prev,
      client: clientId,
      shippingAddress: {
        addressLine1: selected?.shippingAddress?.addressLine1 || selected?.address || '',
        city: selected?.shippingAddress?.city || '',
        state: selected?.shippingAddress?.state || '',
        pincode: selected?.shippingAddress?.pincode || '',
      },
    }));
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        item: '',
        dispatchQuantity: '',
        packageCount: 1,
        bin: '',
        description: '',
        remarks: '',
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'item') {
        const itemObj = itemsList.find((it) => it._id === value);
        if (itemObj) {
          updated[index].description = itemObj.description || itemObj.itemName || '';
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.client) {
      setErrorMessage('Please select a client');
      return;
    }
    if (!formData.plant) {
      setErrorMessage('Please select a plant');
      return;
    }

    const validItems = items.filter((it) => it.item && Number(it.dispatchQuantity) > 0);
    if (validItems.length === 0) {
      setErrorMessage('Please add at least one item with quantity greater than zero');
      return;
    }

    try {
      const payload = {
        ...formData,
        items: validItems.map((it) => ({
          item: it.item,
          dispatchQuantity: Number(it.dispatchQuantity),
          packageCount: Number(it.packageCount) || 1,
          bin: it.bin || null,
          description: it.description,
          remarks: it.remarks,
        })),
      };

      await createChallan(payload).unwrap();
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to create delivery challan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 my-8">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center space-x-2">
            <Truck className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Create Delivery Challan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && <Alert variant="error" message={errorMessage} />}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Challan No"
              value={formData.challanNo}
              onChange={(e) => setFormData({ ...formData, challanNo: e.target.value })}
              placeholder="AUTO"
              helpText="Auto-generates DC-000001"
            />
            <Input
              label="Challan Date"
              type="date"
              value={formData.challanDate}
              onChange={(e) => setFormData({ ...formData, challanDate: e.target.value })}
              required
            />
            <Select
              label="Client *"
              value={formData.client}
              onChange={(e) => handleClientChange(e.target.value)}
              required
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.clientName || c.name} ({c.clientCode || c.code})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Sales Order (Optional)"
              value={formData.salesOrder}
              onChange={(e) => setFormData({ ...formData, salesOrder: e.target.value })}
            >
              <option value="">Direct Dispatch / None</option>
              {salesOrders.map((so) => (
                <option key={so._id} value={so._id}>
                  {so.salesOrderNo}
                </option>
              ))}
            </Select>

            <Select
              label="Plant *"
              value={formData.plant}
              onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
              required
            >
              <option value="">Select Plant</option>
              {plants.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.plantName || p.name}
                </option>
              ))}
            </Select>

            <Select
              label="Store (Optional)"
              value={formData.store}
              onChange={(e) => setFormData({ ...formData, store: e.target.value })}
            >
              <option value="">Select Store</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.storeName || s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Truck className="h-4 w-4" /> Logistics & Transporter Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Transporter Name"
                value={formData.transporterName}
                onChange={(e) => setFormData({ ...formData, transporterName: e.target.value })}
                placeholder="e.g. VRL Logistics"
              />
              <Input
                label="Vehicle No"
                value={formData.vehicleNo}
                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                placeholder="e.g. MH-12-AB-1234"
              />
              <Input
                label="LR / Docket No"
                value={formData.lrNo}
                onChange={(e) => setFormData({ ...formData, lrNo: e.target.value })}
                placeholder="Tracking / LR No"
              />
              <Select
                label="Mode"
                value={formData.modeOfTransport}
                onChange={(e) => setFormData({ ...formData, modeOfTransport: e.target.value })}
              >
                <option value="ROAD">Road</option>
                <option value="AIR">Air</option>
                <option value="SEA">Sea</option>
                <option value="RAIL">Rail</option>
                <option value="COURIER">Courier</option>
                <option value="HAND_DELIVERY">Hand Delivery</option>
              </Select>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Package className="h-4 w-4" /> Dispatch Items
              </h4>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm"
                >
                  <div className="col-span-12 md:col-span-4">
                    <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Item *</label>
                    <select
                      className="w-full mt-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm"
                      value={row.item}
                      onChange={(e) => handleItemChange(idx, 'item', e.target.value)}
                      required
                    >
                      <option value="">Select Finished Item</option>
                      {itemsList.map((it) => (
                        <option key={it._id} value={it._id}>
                          {it.itemCode} - {it.itemName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Qty *</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full mt-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm"
                      value={row.dispatchQuantity}
                      onChange={(e) => handleItemChange(idx, 'dispatchQuantity', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Packages</label>
                    <input
                      type="number"
                      className="w-full mt-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm"
                      value={row.packageCount}
                      onChange={(e) => handleItemChange(idx, 'packageCount', e.target.value)}
                    />
                  </div>

                  <div className="col-span-10 md:col-span-3">
                    <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Source Bin</label>
                    <select
                      className="w-full mt-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm"
                      value={row.bin}
                      onChange={(e) => handleItemChange(idx, 'bin', e.target.value)}
                    >
                      <option value="">Select Bin (Optional)</option>
                      {bins.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.binCode || b.binName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1 flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Textarea
            label="Remarks / Special Instructions"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Add delivery notes, packaging labels, or special transport instructions..."
            rows={2}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Challan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryChallanCreateModal;
