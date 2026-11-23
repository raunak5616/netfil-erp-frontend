import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Textarea } from '../../components/ui/FormField';
import {
  useGetProductionExecutionsQuery,
  useCreateProductionExecutionMutation,
  useCompleteProductionExecutionMutation,
} from '../../features/workOrders/workOrdersApi';
import {
  Wrench,
  Play,
  CheckCircle2,
  Clock,
  Package,
  Layers,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const ProductionExecutionModal = ({ isOpen, workOrder, onClose, onSuccess }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [producedQty, setProducedQty] = useState('');
  const [remarks, setRemarks] = useState('');

  const [createExecution, { isLoading: starting }] = useCreateProductionExecutionMutation();
  const [completeExecution, { isLoading: completing }] = useCompleteProductionExecutionMutation();

  const { data: peData, isLoading: loadingPE, refetch } = useGetProductionExecutionsQuery(
    { workOrder: workOrder?._id },
    { skip: !isOpen || !workOrder?._id }
  );

  const executions = peData?.productionExecutions || [];
  const activeExecution = executions.find((e) => e.status === 'STARTED');
  const completedExecutions = executions.filter((e) => e.status === 'COMPLETED');

  useEffect(() => {
    if (workOrder && isOpen) {
      setError('');
      setSuccess('');
      setRemarks('');
      setProducedQty(workOrder.productionQuantity || '');
    }
  }, [workOrder, isOpen]);

  const handleStartProduction = async () => {
    setError('');
    setSuccess('');
    try {
      await createExecution({
        workOrderId: workOrder._id,
        remarks: remarks.trim() || `Shop floor production initiated for ${workOrder.workOrderNo}`,
      }).unwrap();
      setSuccess('Production started successfully. Work Order is now IN PROGRESS.');
      refetch();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to start production');
    }
  };

  const handleCompleteProduction = async () => {
    if (!activeExecution) return;
    setError('');
    setSuccess('');

    const numQty = Number(producedQty);
    if (!numQty || numQty <= 0) {
      setError('Please enter a valid produced quantity');
      return;
    }
    if (numQty > activeExecution.plannedQuantity) {
      setError(`Produced quantity cannot exceed planned quantity (${activeExecution.plannedQuantity})`);
      return;
    }

    try {
      await completeExecution({
        id: activeExecution._id,
        data: {
          producedQuantity: numQty,
          remarks: remarks.trim() || 'Production completed on shop floor',
        },
      }).unwrap();
      setSuccess('Production execution completed successfully. Work Order marked COMPLETED.');
      refetch();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to complete production');
    }
  };

  if (!workOrder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Production Execution — ${workOrder.workOrderNo}`}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {!activeExecution && workOrder.status !== 'COMPLETED' && (
            <Button
              variant="primary"
              onClick={handleStartProduction}
              isLoading={starting}
              icon={Play}
            >
              Start Shop Floor Execution
            </Button>
          )}
          {activeExecution && (
            <Button
              variant="primary"
              onClick={handleCompleteProduction}
              isLoading={completing}
              icon={CheckCircle2}
            >
              Complete Production
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Work Order Header Overview */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Product / Item</div>
            <div className="font-bold text-slate-900 mt-0.5">{workOrder.customerName || 'Air Filter Assembly'}</div>
            <div className="text-xs font-mono text-slate-500">{workOrder.salesOrder?.salesOrderNo}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Planned Quantity</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {workOrder.productionQuantity} {workOrder.uom?.uomCode || 'Units'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Current WO Status</div>
            <div className="mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                {workOrder.status}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Plant / Factory</div>
            <div className="font-medium text-slate-800 mt-0.5">
              {workOrder.plant?.plantName || workOrder.plant?.plantCode || 'Plant-1'}
            </div>
          </div>
        </div>

        {/* Active Execution Tracking Card */}
        {activeExecution ? (
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold">
                <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                Active Shop Floor Job Card: <span className="font-mono">{activeExecution.executionNo}</span>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase bg-amber-200 text-amber-900 rounded-full">
                IN PROGRESS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-600">Started At</div>
                <div className="text-sm font-medium text-slate-900">
                  {new Date(activeExecution.startedAt).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600">Started By</div>
                <div className="text-sm font-medium text-slate-900">
                  {activeExecution.startedBy?.username || 'Production Supervisor'}
                </div>
              </div>
            </div>

            {/* Input produced quantity and notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <FormField label="Actual Produced Finished Goods Quantity" required>
                <Input
                  type="number"
                  min="1"
                  max={activeExecution.plannedQuantity}
                  value={producedQty}
                  onChange={(e) => setProducedQty(e.target.value)}
                  placeholder="Enter finished goods quantity"
                  required
                />
              </FormField>

              <FormField label="Completion Notes / Wastage / Scrap Remarks">
                <Textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. 100 units assembled, 0 defects, test passed"
                />
              </FormField>
            </div>
          </div>
        ) : workOrder.status === 'COMPLETED' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-emerald-900 text-base">Production Fully Completed</div>
              <div className="text-xs text-emerald-700 mt-0.5">
                All finished goods have been assembled and recorded. Ready for Finished Goods Quality Inspection & Dispatch.
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Play className="w-5 h-5 text-blue-600" />
              Start Shop Floor Production
            </div>
            <p className="text-sm text-slate-600">
              Starting production will create an active Job Card (Production Execution), advance the Work Order status to{' '}
              <span className="font-semibold text-slate-800">IN PROGRESS</span>, and enable shop-floor output logging.
            </p>
            <FormField label="Initiation Notes">
              <Textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional shop floor notes..."
              />
            </FormField>
          </div>
        )}

        {/* Historical Execution Records */}
        {completedExecutions.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Execution History
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {completedExecutions.map((pe) => (
                <div key={pe._id} className="p-3 bg-white flex justify-between items-center text-sm">
                  <div>
                    <span className="font-mono font-semibold text-slate-800">{pe.executionNo}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      Completed {pe.completedAt ? new Date(pe.completedAt).toLocaleDateString() : ''}
                    </span>
                    {pe.remarks && <div className="text-xs text-slate-600 mt-0.5 italic">{pe.remarks}</div>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700">{pe.producedQuantity}</span> /{' '}
                    <span className="text-slate-500">{pe.plannedQuantity} Units</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProductionExecutionModal;
