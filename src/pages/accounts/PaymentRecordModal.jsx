import React, { useState, useEffect } from 'react';
import { useCreatePaymentMutation } from '../../features/accounts/accountsApi';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select, Textarea } from '../../components/ui/FormField';
import { X, CreditCard, CheckCircle, IndianRupee } from 'lucide-react';

const PaymentRecordModal = ({ isOpen, onClose, invoice, onSuccess }) => {
  const [createPayment, { isLoading: isSubmitting }] = useCreatePaymentMutation();

  const [formData, setFormData] = useState({
    paymentNo: 'AUTO',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMode: 'BANK_TRANSFER',
    transactionReference: '',
    bankName: '',
    remarks: '',
  });

  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (invoice) {
      setFormData((prev) => ({
        ...prev,
        amount: invoice.balanceAmount || invoice.totalAmount || '',
      }));
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const numAmount = Number(formData.amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than 0');
      return;
    }

    if (numAmount > (invoice.balanceAmount || invoice.totalAmount) + 0.01) {
      setErrorMessage(`Payment amount cannot exceed outstanding balance of ₹${invoice.balanceAmount}`);
      return;
    }

    try {
      const payload = {
        paymentNo: formData.paymentNo,
        paymentDate: formData.paymentDate,
        paymentType: invoice.invoiceType === 'SALES' ? 'RECEIPT' : 'PAYMENT',
        invoice: invoice._id,
        amount: numAmount,
        paymentMode: formData.paymentMode,
        transactionReference: formData.transactionReference,
        bankName: formData.bankName,
        remarks: formData.remarks,
      };

      await createPayment(payload).unwrap();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to record payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 my-8">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Record {invoice.invoiceType === 'SALES' ? 'Receipt' : 'Payment'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && <Alert variant="error" message={errorMessage} />}

          {/* Invoice Summary Box */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs space-y-1">
            <div className="flex justify-between font-medium">
              <span className="text-neutral-500">Invoice Reference:</span>
              <span className="text-neutral-900 dark:text-white font-mono">{invoice.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Party:</span>
              <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                {invoice.partySnapshot?.name || 'Party'}
              </span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
              <span>Total Invoice Amount:</span>
              <span className="font-semibold">₹{invoice.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-primary-600 font-bold border-t border-neutral-200 dark:border-neutral-700 pt-1">
              <span>Outstanding Balance:</span>
              <span>₹{invoice.balanceAmount?.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Payment Date"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
            />
            <Input
              label="Amount to Pay (₹) *"
              type="number"
              step="any"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Payment Mode"
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
            >
              <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
              <option value="CHEQUE">Cheque</option>
              <option value="UPI">UPI / QR</option>
              <option value="NEFT_RTGS">RTGS</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </Select>

            <Input
              label="Transaction / UTR / Cheque No"
              value={formData.transactionReference}
              onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
              placeholder="e.g. UTR12345678"
            />
          </div>

          <Input
            label="Bank Name (Optional)"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            placeholder="e.g. HDFC Bank, ICICI Bank"
          />

          <Textarea
            label="Remarks / Notes"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="e.g. Part payment against delivery batch 1"
            rows={2}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentRecordModal;
