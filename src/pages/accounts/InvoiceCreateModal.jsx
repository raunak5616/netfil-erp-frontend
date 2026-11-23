import React, { useState, useEffect } from 'react';
import { useCreateInvoiceMutation } from '../../features/accounts/accountsApi';
import { useGetClientsQuery } from '../../features/masterData/masterDataApi';
import { useGetSuppliersQuery } from '../../features/suppliers/suppliersApi';
import { useGetSalesOrdersQuery } from '../../features/salesOrders/salesOrdersApi';
import { useGetDeliveryChallansQuery } from '../../features/dispatch/dispatchApi';
import { useGetItemsQuery } from '../../features/products/productsApi';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select, Textarea } from '../../components/ui/FormField';
import { X, Plus, Trash2, Receipt, FileText, Calculator } from 'lucide-react';

const InvoiceCreateModal = ({ isOpen, onClose, initialData }) => {
  const [createInvoice, { isLoading: isSubmitting }] = useCreateInvoiceMutation();

  const [invoiceType, setInvoiceType] = useState('SALES');
  const { data: clientsData } = useGetClientsQuery();
  const { data: suppliersData } = useGetSuppliersQuery();
  const { data: salesOrdersData } = useGetSalesOrdersQuery();
  const { data: challansData } = useGetDeliveryChallansQuery({ status: 'DISPATCHED' });
  const { data: itemsData } = useGetItemsQuery();

  const clients = clientsData?.data || clientsData || [];
  const suppliers = suppliersData?.data || suppliersData || [];
  const salesOrders = salesOrdersData?.data || salesOrdersData || [];
  const challans = challansData?.data || challansData || [];
  const itemsList = itemsData?.data || itemsData || [];

  const [formData, setFormData] = useState({
    invoiceNo: 'AUTO',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    party: '',
    deliveryChallan: '',
    salesOrder: '',
    purchaseOrder: '',
    otherCharges: 0,
    discountAmount: 0,
    terms: 'Net 30 Days. Payment via Bank Transfer / NEFT.',
    remarks: '',
  });

  const [items, setItems] = useState([
    {
      item: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 18,
    },
  ]);

  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (initialData?.deliveryChallan) {
      const dc = initialData.deliveryChallan;
      setInvoiceType('SALES');
      setFormData((prev) => ({
        ...prev,
        deliveryChallan: dc._id,
        salesOrder: dc.salesOrder?._id || dc.salesOrder || '',
        party: dc.client?._id || dc.client || '',
      }));

      if (dc.items && dc.items.length > 0) {
        setItems(
          dc.items.map((it) => ({
            item: it.item?._id || it.item || '',
            description: it.itemNameSnapshot || it.description || 'Finished Good',
            quantity: it.dispatchQuantity || 1,
            unitPrice: 0,
            taxRate: 18,
          }))
        );
      }
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { item: '', description: '', quantity: 1, unitPrice: 0, taxRate: 18 },
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
          updated[index].description = itemObj.itemName || itemObj.description || '';
          if (itemObj.unitPrice || itemObj.price) {
            updated[index].unitPrice = itemObj.unitPrice || itemObj.price;
          }
        }
      }
      return updated;
    });
  };

  // Live Totals
  const { subtotal, totalTax, grandTotal } = items.reduce(
    (acc, row) => {
      const qty = Number(row.quantity) || 0;
      const rate = Number(row.unitPrice) || 0;
      const tax = Number(row.taxRate) || 0;
      const line = qty * rate;
      const taxAmt = (line * tax) / 100;
      acc.subtotal += line;
      acc.totalTax += taxAmt;
      return acc;
    },
    { subtotal: 0, totalTax: 0, grandTotal: 0 }
  );

  const finalTotal = Math.max(
    0,
    subtotal + totalTax + Number(formData.otherCharges || 0) - Number(formData.discountAmount || 0)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.party) {
      setErrorMessage(`Please select a ${invoiceType === 'SALES' ? 'Client' : 'Supplier'}`);
      return;
    }

    const validItems = items.filter((it) => it.description && Number(it.quantity) > 0);
    if (validItems.length === 0) {
      setErrorMessage('Please add at least one line item with valid quantity');
      return;
    }

    try {
      const payload = {
        ...formData,
        invoiceType,
        partyType: invoiceType === 'SALES' ? 'Client' : 'Supplier',
        items: validItems.map((it) => ({
          item: it.item || null,
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          taxRate: Number(it.taxRate),
        })),
        otherCharges: Number(formData.otherCharges || 0),
        discountAmount: Number(formData.discountAmount || 0),
      };

      await createInvoice(payload).unwrap();
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to create invoice');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 my-8">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center space-x-2">
            <Receipt className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Create New Invoice
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

          {/* Type Selector */}
          <div className="flex items-center gap-4 bg-neutral-100 dark:bg-neutral-800/60 p-2 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setInvoiceType('SALES');
                setFormData((prev) => ({ ...prev, party: '' }));
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                invoiceType === 'SALES'
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Sales Invoice (Customer Bill)
            </button>
            <button
              type="button"
              onClick={() => {
                setInvoiceType('PURCHASE');
                setFormData((prev) => ({ ...prev, party: '' }));
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                invoiceType === 'PURCHASE'
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Purchase Invoice (Vendor Bill)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Invoice No"
              value={formData.invoiceNo}
              onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
              placeholder="AUTO"
              helpText="Auto-generates INV-000001"
            />
            <Input
              label="Invoice Date"
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
            <Select
              label={invoiceType === 'SALES' ? 'Customer / Client *' : 'Supplier / Vendor *'}
              value={formData.party}
              onChange={(e) => setFormData({ ...formData, party: e.target.value })}
              required
            >
              <option value="">Select {invoiceType === 'SALES' ? 'Customer' : 'Supplier'}</option>
              {invoiceType === 'SALES'
                ? clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.clientName || c.name} ({c.clientCode || c.code})
                    </option>
                  ))
                : suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.supplierName || s.name} ({s.supplierCode || s.code})
                    </option>
                  ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoiceType === 'SALES' ? (
              <>
                <Select
                  label="Delivery Challan Ref (Optional)"
                  value={formData.deliveryChallan}
                  onChange={(e) => setFormData({ ...formData, deliveryChallan: e.target.value })}
                >
                  <option value="">None / Direct Invoice</option>
                  {challans.map((dc) => (
                    <option key={dc._id} value={dc._id}>
                      {dc.challanNo} - {dc.clientSnapshot?.name || 'Client'}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Sales Order Ref (Optional)"
                  value={formData.salesOrder}
                  onChange={(e) => setFormData({ ...formData, salesOrder: e.target.value })}
                >
                  <option value="">None / Direct Invoice</option>
                  {salesOrders.map((so) => (
                    <option key={so._id} value={so._id}>
                      {so.salesOrderNo}
                    </option>
                  ))}
                </Select>
              </>
            ) : (
              <Input
                label="Vendor Reference / PO Ref"
                value={formData.purchaseOrder}
                onChange={(e) => setFormData({ ...formData, purchaseOrder: e.target.value })}
                placeholder="e.g. PO-000001 or Vendor Bill Ref"
              />
            )}
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Line Items
              </h4>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Line
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((row, idx) => {
                const rowTotal = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
                const rowTax = (rowTotal * (Number(row.taxRate) || 0)) / 100;
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm"
                  >
                    <div className="col-span-12 md:col-span-4">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Description *</label>
                      <input
                        type="text"
                        className="w-full mt-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm"
                        value={row.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="Item name / billing description"
                        required
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Qty *</label>
                      <input
                        type="number"
                        step="any"
                        className="w-full mt-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm"
                        value={row.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Unit Price (₹) *</label>
                      <input
                        type="number"
                        step="any"
                        className="w-full mt-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm"
                        value={row.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-span-3 md:col-span-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Tax (%)</label>
                      <select
                        className="w-full mt-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 text-sm"
                        value={row.taxRate}
                        onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>

                    <div className="col-span-12 md:col-span-2 flex items-center justify-between pt-4">
                      <div className="text-right">
                        <span className="text-xs text-neutral-400 block">Line Total</span>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs">
                          ₹{(rowTotal + rowTax).toFixed(2)}
                        </span>
                      </div>
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
                );
              })}
            </div>
          </div>

          {/* Pricing Totals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Textarea
                label="Terms & Conditions"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                rows={2}
              />
              <Input
                label="Internal Remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Notes for accounting team..."
              />
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Subtotal (Net Amount):</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Estimated Tax (GST):</span>
                <span className="font-medium">₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-neutral-600 dark:text-neutral-400">Freight / Other Charges:</span>
                <input
                  type="number"
                  step="any"
                  value={formData.otherCharges}
                  onChange={(e) => setFormData({ ...formData, otherCharges: e.target.value })}
                  className="w-28 text-right rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-neutral-600 dark:text-neutral-400">Discount:</span>
                <input
                  type="number"
                  step="any"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                  className="w-28 text-right rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs"
                />
              </div>
              <div className="pt-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-between font-bold text-base text-neutral-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-primary-600">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Invoice
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceCreateModal;
