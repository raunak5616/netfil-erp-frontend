import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Textarea, FormField } from '../../components/ui/FormField';
import { updateSalesOrder } from '../../services/salesOrderService';
import { ShoppingBag, Lock, Calculator, AlertCircle } from 'lucide-react';

const SalesOrderEditModal = ({ isOpen, salesOrder, onClose, onSuccess }) => {
  const isLocked = salesOrder && ['confirmed', 'in_progress', 'completed'].includes(salesOrder.status);

  // Administrative / Terms Fields
  const [customerPoNumber, setCustomerPoNumber] = useState('');
  const [customerPoDate, setCustomerPoDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [generalTerms, setGeneralTerms] = useState('');
  const [remarks, setRemarks] = useState('');

  // Draft Commercial Fields
  const [pfAmount, setPfAmount] = useState(0);
  const [freightAmount, setFreightAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxName, setTaxName] = useState('GST');
  const [taxRate, setTaxRate] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!salesOrder || !isOpen) return;

    setCustomerPoNumber(salesOrder.customerPoNumber || '');
    setCustomerPoDate(salesOrder.customerPoDate ? new Date(salesOrder.customerPoDate).toISOString().split('T')[0] : '');
    setExpectedDeliveryDate(salesOrder.expectedDeliveryDate ? new Date(salesOrder.expectedDeliveryDate).toISOString().split('T')[0] : '');
    setPaymentTerms(salesOrder.paymentTerms || '');
    setDeliveryTerms(salesOrder.deliveryTerms || '');
    setGeneralTerms(salesOrder.generalTerms || '');
    setRemarks(salesOrder.remarks || '');

    setPfAmount(salesOrder.pfAmount || 0);
    setFreightAmount(salesOrder.freightAmount || 0);
    setDiscountAmount(salesOrder.discountAmount || 0);
    setTaxName(salesOrder.taxName || 'GST');
    setTaxRate(salesOrder.taxRate || 0);
  }, [salesOrder, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salesOrder) return;

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        customerPoNumber: customerPoNumber.trim(),
        customerPoDate: customerPoDate || null,
        expectedDeliveryDate: expectedDeliveryDate || null,
        paymentTerms: paymentTerms.trim(),
        deliveryTerms: deliveryTerms.trim(),
        generalTerms: generalTerms.trim(),
        remarks: remarks.trim()
      };

      // Include commercial parameters ONLY if order is in draft status
      if (!isLocked) {
        payload.pfAmount = Number(pfAmount) || 0;
        payload.freightAmount = Number(freightAmount) || 0;
        payload.discountAmount = Number(discountAmount) || 0;
        payload.taxName = taxName.trim();
        payload.taxRate = Number(taxRate) || 0;
      }

      const res = await updateSalesOrder(salesOrder._id, payload);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || 'Failed to update Sales Order');
      }
    } catch (err) {
      console.error('Update Sales Order error:', err);
      setError(err.response?.data?.message || 'Server error updating Sales Order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={salesOrder ? `Edit Sales Order — ${salesOrder.salesOrderNo}` : 'Edit Sales Order'}
      size="lg"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Locked status banner */}
          {isLocked && (
            <div style={{ padding: '12px', background: 'var(--neutral-100)', border: '1px solid var(--neutral-300)', borderRadius: '6px', fontSize: '12.5px', color: 'var(--neutral-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} color="var(--warning-600)" />
              <span>
                Commercial values (P&F, Freight, Discount, Tax) are <strong>locked</strong> because this Sales Order is in <strong>{salesOrder.status.toUpperCase()}</strong> status. You can update Customer PO details, delivery dates, terms, and remarks.
              </span>
            </div>
          )}

          {/* Section 1: Customer PO & Delivery Information */}
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={16} color="var(--primary-600)" />
              Customer PO & Delivery Terms
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <FormField label="Customer PO Number">
                <Input
                  placeholder="e.g. PO-2026-9901"
                  value={customerPoNumber}
                  onChange={(e) => setCustomerPoNumber(e.target.value)}
                />
              </FormField>

              <FormField label="Customer PO Date">
                <Input
                  type="date"
                  value={customerPoDate}
                  onChange={(e) => setCustomerPoDate(e.target.value)}
                />
              </FormField>

              <FormField label="Expected Delivery Date">
                <Input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <FormField label="Payment Terms">
                <Input
                  placeholder="Payment terms..."
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                />
              </FormField>

              <FormField label="Delivery Terms">
                <Input
                  placeholder="Delivery terms..."
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="General Terms & Conditions">
              <Textarea
                rows={2}
                placeholder="General terms..."
                value={generalTerms}
                onChange={(e) => setGeneralTerms(e.target.value)}
              />
            </FormField>

            <FormField label="Order Remarks" style={{ marginTop: '12px' }}>
              <Textarea
                rows={2}
                placeholder="Order remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </FormField>
          </div>

          {/* Section 2: Draft Commercial Parameters (Only when NOT locked) */}
          {!isLocked && (
            <div className="card" style={{ padding: '16px', background: 'var(--neutral-50)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={16} color="var(--primary-600)" />
                Draft Commercial Parameters
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <FormField label="P&F Amount (₹)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pfAmount}
                    onChange={(e) => setPfAmount(e.target.value)}
                  />
                </FormField>

                <FormField label="Freight Amount (₹)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(e.target.value)}
                  />
                </FormField>

                <FormField label="Discount Amount (₹)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                  />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Tax Name">
                  <Input
                    placeholder="e.g. GST, IGST, VAT"
                    value={taxName}
                    onChange={(e) => setTaxName(e.target.value)}
                  />
                </FormField>

                <FormField label="Tax Rate (%)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--neutral-200)' }}>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Save Sales Order Changes'}
            </Button>
          </div>

        </div>
      </form>
    </Modal>
  );
};

export default SalesOrderEditModal;
