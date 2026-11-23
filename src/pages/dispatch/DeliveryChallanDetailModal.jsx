import React, { useState } from 'react';
import {
  useGetDeliveryChallanByIdQuery,
  useDispatchDeliveryChallanMutation,
  useDeliverDeliveryChallanMutation,
  useCancelDeliveryChallanMutation,
} from '../../features/dispatch/dispatchApi';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import {
  X,
  Truck,
  Package,
  Calendar,
  Building2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Printer,
  Ban,
} from 'lucide-react';

const DeliveryChallanDetailModal = ({ isOpen, onClose, challanId, onInvoiceCreate }) => {
  const { data: responseData, isLoading } = useGetDeliveryChallanByIdQuery(challanId, {
    skip: !challanId || !isOpen,
  });

  const [dispatchChallan, { isLoading: isDispatching }] = useDispatchDeliveryChallanMutation();
  const [deliverChallan, { isLoading: isDelivering }] = useDeliverDeliveryChallanMutation();
  const [cancelChallan, { isLoading: isCancelling }] = useCancelDeliveryChallanMutation();

  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  if (!isOpen || !challanId) return null;

  const challan = responseData?.data || responseData;

  const handleDispatch = async () => {
    if (!window.confirm(`Confirm dispatch for Challan ${challan.challanNo}? This will issue finished goods from inventory.`)) return;
    try {
      setActionError(null);
      await dispatchChallan({ id: challanId }).unwrap();
      setActionSuccess('Challan dispatched and inventory updated.');
    } catch (err) {
      setActionError(err?.data?.message || err?.message || 'Failed to dispatch challan');
    }
  };

  const handleDeliver = async () => {
    if (!window.confirm(`Mark Challan ${challan.challanNo} as delivered?`)) return;
    try {
      setActionError(null);
      await deliverChallan({ id: challanId }).unwrap();
      setActionSuccess('Challan status marked as DELIVERED.');
    } catch (err) {
      setActionError(err?.data?.message || err?.message || 'Failed to update status');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Cancel Challan ${challan.challanNo}?`)) return;
    try {
      setActionError(null);
      await cancelChallan({ id: challanId }).unwrap();
      setActionSuccess('Challan cancelled.');
    } catch (err) {
      setActionError(err?.data?.message || err?.message || 'Failed to cancel challan');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {challan?.challanNo || 'Delivery Challan'}
                </h2>
                {challan && <StatusBadge status={challan.status} />}
              </div>
              <p className="text-xs text-neutral-500">
                Created on {challan?.createdAt ? new Date(challan.createdAt).toLocaleDateString() : 'N/A'}
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
          ) : challan ? (
            <>
              {/* Top Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 text-sm">
                <div>
                  <span className="text-xs text-neutral-500 block">Client</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {challan.clientSnapshot?.name || challan.client?.clientName || challan.client?.name || 'N/A'}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    GSTIN: {challan.clientSnapshot?.gstin || challan.client?.gstNumber || 'N/A'}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-neutral-500 block">Sales Order Ref</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {challan.salesOrderNoSnapshot || challan.salesOrder?.salesOrderNo || 'Direct Dispatch'}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    Plant: {challan.plant?.plantName || challan.plant?.name || 'Main Plant'}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-neutral-500 block">Transport & Logistics</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {challan.transporterName || 'Self / Own Vehicle'}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    Vehicle: {challan.vehicleNo || 'N/A'} | LR: {challan.lrNo || 'N/A'} ({challan.modeOfTransport})
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 text-xs">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Shipping Destination:
                </span>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {challan.shippingAddress?.addressLine1 || 'N/A'}{' '}
                  {challan.shippingAddress?.city && `, ${challan.shippingAddress.city}`}{' '}
                  {challan.shippingAddress?.state && `, ${challan.shippingAddress.state}`}{' '}
                  {challan.shippingAddress?.pincode && ` - ${challan.shippingAddress.pincode}`}
                </p>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Dispatched Items ({challan.items?.length || 0})
                </h4>
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-100 dark:bg-neutral-800 text-xs uppercase text-neutral-600 dark:text-neutral-300">
                      <tr>
                        <th className="px-4 py-2.5">Item Code & Name</th>
                        <th className="px-4 py-2.5">Description</th>
                        <th className="px-4 py-2.5 text-right">Dispatch Qty</th>
                        <th className="px-4 py-2.5 text-center">UOM</th>
                        <th className="px-4 py-2.5 text-center">Packages</th>
                        <th className="px-4 py-2.5">Bin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {challan.items?.map((it, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-white">
                            {it.itemCodeSnapshot || it.item?.itemCode || 'ITEM'}
                            <div className="text-xs text-neutral-500">{it.itemNameSnapshot || it.item?.itemName}</div>
                          </td>
                          <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400 text-xs">
                            {it.description || '-'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-neutral-900 dark:text-neutral-100">
                            {it.dispatchQuantity}
                          </td>
                          <td className="px-4 py-2.5 text-center text-xs text-neutral-500">
                            {it.uomCodeSnapshot || it.uom?.uomCode || 'PCS'}
                          </td>
                          <td className="px-4 py-2.5 text-center text-xs text-neutral-600 dark:text-neutral-400">
                            {it.packageCount || 1}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-neutral-500">
                            {it.bin?.binCode || it.bin?.binName || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-neutral-50 dark:bg-neutral-800/50 font-semibold text-xs">
                      <tr>
                        <td colSpan={2} className="px-4 py-2.5 text-right">
                          Total:
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-primary-600">
                          {challan.totalQuantity}
                        </td>
                        <td></td>
                        <td className="px-4 py-2.5 text-center">{challan.totalPackages}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {challan.remarks && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-xs text-neutral-600 dark:text-neutral-400">
                  <span className="font-semibold block mb-0.5">Remarks:</span>
                  {challan.remarks}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="flex gap-2">
            {challan?.status === 'DRAFT' && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                isLoading={isCancelling}
              >
                <Ban className="h-4 w-4 mr-1" /> Cancel Challan
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {challan?.status === 'DRAFT' && (
              <Button
                variant="primary"
                onClick={handleDispatch}
                isLoading={isDispatching}
              >
                <Truck className="h-4 w-4 mr-1" /> Dispatch Goods
              </Button>
            )}

            {challan?.status === 'DISPATCHED' && (
              <>
                <Button
                  variant="success"
                  onClick={handleDeliver}
                  isLoading={isDelivering}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Mark Delivered
                </Button>
                {onInvoiceCreate && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      onClose();
                      onInvoiceCreate(challan);
                    }}
                  >
                    Generate Invoice
                  </Button>
                )}
              </>
            )}

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryChallanDetailModal;
