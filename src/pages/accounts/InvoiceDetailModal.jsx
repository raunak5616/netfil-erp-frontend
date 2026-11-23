import React, { useState } from 'react';
import {
  useGetInvoiceByIdQuery,
  usePostInvoiceMutation,
  useCancelInvoiceMutation,
} from '../../features/accounts/accountsApi';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import PaymentRecordModal from './PaymentRecordModal';
import {
  X,
  Receipt,
  Printer,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  IndianRupee,
  FileCheck,
  Ban,
} from 'lucide-react';

const InvoiceDetailModal = ({ isOpen, onClose, invoiceId }) => {
  const { data: responseData, isLoading, refetch } = useGetInvoiceByIdQuery(invoiceId, {
    skip: !invoiceId || !isOpen,
  });

  const [postInvoice, { isLoading: isPosting }] = usePostInvoiceMutation();
  const [cancelInvoice, { isLoading: isCancelling }] = useCancelInvoiceMutation();

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  if (!isOpen || !invoiceId) return null;

  const invoice = responseData?.data || responseData;

  const handlePost = async () => {
    if (!window.confirm(`Post Invoice ${invoice.invoiceNo}? Once posted, amounts cannot be altered.`)) return;
    try {
      setActionError(null);
      await postInvoice(invoiceId).unwrap();
      setActionSuccess('Invoice successfully posted and locked.');
      refetch();
    } catch (err) {
      setActionError(err?.data?.message || err?.message || 'Failed to post invoice');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Cancel Invoice ${invoice.invoiceNo}?`)) return;
    try {
      setActionError(null);
      await cancelInvoice(invoiceId).unwrap();
      setActionSuccess('Invoice cancelled.');
      refetch();
    } catch (err) {
      setActionError(err?.data?.message || err?.message || 'Failed to cancel invoice');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 my-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {invoice?.invoiceNo || 'Invoice Details'}
                  </h2>
                  {invoice && <StatusBadge status={invoice.status} />}
                  {invoice && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        invoice.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : invoice.paymentStatus === 'PARTIALLY_PAID'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {invoice.paymentStatus?.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  {invoice?.invoiceType === 'SALES' ? 'Tax Invoice (Sales)' : 'Vendor Bill (Purchase)'} | Date:{' '}
                  {invoice?.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {actionError && <Alert variant="error" message={actionError} />}
            {actionSuccess && <Alert variant="success" message={actionSuccess} />}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Clock className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : invoice ? (
              <>
                {/* Party & Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 text-sm">
                  <div>
                    <span className="text-xs text-neutral-500 block">
                      {invoice.invoiceType === 'SALES' ? 'Customer Details' : 'Supplier Details'}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {invoice.partySnapshot?.name || invoice.party?.clientName || invoice.party?.supplierName || 'Party'}
                    </span>
                    <p className="text-xs text-neutral-500 mt-1">
                      GSTIN: {invoice.partySnapshot?.gstin || 'N/A'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {invoice.partySnapshot?.address || 'Address on file'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-neutral-500 block">References</span>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1">
                      <span className="text-neutral-500">Sales Order:</span>{' '}
                      {invoice.salesOrderNoSnapshot || invoice.salesOrder?.salesOrderNo || 'N/A'}
                    </p>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      <span className="text-neutral-500">Delivery Challan:</span>{' '}
                      {invoice.deliveryChallanNoSnapshot || invoice.deliveryChallan?.challanNo || 'N/A'}
                    </p>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      <span className="text-neutral-500">PO Ref:</span>{' '}
                      {invoice.purchaseOrderNoSnapshot || invoice.purchaseOrder?.poNumber || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-neutral-500 block">Payment Schedule</span>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1">
                      <span className="text-neutral-500">Due Date:</span>{' '}
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Immediate'}
                    </p>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      <span className="text-neutral-500">Terms:</span> {invoice.terms || 'Net 30 Days'}
                    </p>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-100 dark:bg-neutral-800 text-xs uppercase text-neutral-600 dark:text-neutral-300">
                      <tr>
                        <th className="px-4 py-2.5">Item Description</th>
                        <th className="px-4 py-2.5 text-right">Qty</th>
                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-center">Tax %</th>
                        <th className="px-4 py-2.5 text-right">Tax Amt</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {invoice.items?.map((it, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-white">
                            {it.description}
                            {it.itemCodeSnapshot && (
                              <span className="text-xs text-neutral-400 block font-mono">
                                {it.itemCodeSnapshot}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">{it.quantity}</td>
                          <td className="px-4 py-2.5 text-right">₹{it.unitPrice?.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-center text-xs">{it.taxRate}%</td>
                          <td className="px-4 py-2.5 text-right text-xs text-neutral-500">
                            ₹{it.taxAmount?.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-neutral-900 dark:text-white">
                            ₹{(it.lineTotal + (it.taxAmount || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals & Balance Summary */}
                <div className="flex justify-end">
                  <div className="w-80 bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2 text-sm">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Subtotal:</span>
                      <span>₹{invoice.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Total Tax:</span>
                      <span>₹{invoice.taxAmount?.toFixed(2)}</span>
                    </div>
                    {invoice.otherCharges > 0 && (
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Other Charges:</span>
                        <span>₹{invoice.otherCharges?.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span>-₹{invoice.discountAmount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-between font-bold text-base text-neutral-900 dark:text-white">
                      <span>Total Amount:</span>
                      <span>₹{invoice.totalAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Paid Amount:</span>
                      <span>₹{invoice.paidAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-primary-600 font-bold border-t border-neutral-200 dark:border-neutral-700 pt-1">
                      <span>Outstanding Balance:</span>
                      <span>₹{invoice.balanceAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {invoice.remarks && (
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-semibold block mb-0.5">Remarks:</span>
                    {invoice.remarks}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <div>
              {invoice?.status === 'DRAFT' && (
                <Button variant="danger" size="sm" onClick={handleCancel} isLoading={isCancelling}>
                  <Ban className="h-4 w-4 mr-1" /> Cancel Invoice
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {invoice?.status === 'DRAFT' && (
                <Button variant="primary" onClick={handlePost} isLoading={isPosting}>
                  <FileCheck className="h-4 w-4 mr-1" /> Post & Lock Invoice
                </Button>
              )}

              {invoice?.status === 'POSTED' && invoice.balanceAmount > 0 && (
                <Button variant="primary" onClick={() => setIsPaymentOpen(true)}>
                  <IndianRupee className="h-4 w-4 mr-1" /> Record Payment
                </Button>
              )}

              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentOpen && (
        <PaymentRecordModal
          isOpen={isPaymentOpen}
          invoice={invoice}
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
};

export default InvoiceDetailModal;
