import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../../components/ui/StatusBadge';

const ActiveWorkOrdersTable = ({ workOrders }) => {
  if (!workOrders || workOrders.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded p-6 text-center">
        <p className="text-sm font-medium text-slate-700 m-0">No active work orders</p>
        <p className="text-xs text-slate-500 mt-1 mb-3">There are no work orders currently in progress.</p>
        <Link to="/work-orders" className="inline-block px-3 py-1.5 bg-indigo-600 text-white text-[12px] font-medium rounded hover:bg-indigo-700">
          Create Work Order
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">WO Number</th>
              <th className="px-3 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Item / Product</th>
              <th className="px-3 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right">Target Qty</th>
              <th className="px-3 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workOrders.map((wo, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2 text-[13px] text-indigo-600 font-medium">
                  <Link to={`/work-orders/${wo._id}`} className="hover:underline">{wo.workOrderNumber}</Link>
                </td>
                <td className="px-3 py-2 text-[13px] text-slate-600 truncate max-w-[150px]" title={wo.item?.itemName || wo.itemNameSnapshot}>
                  {wo.item?.itemName || wo.itemNameSnapshot || '—'}
                </td>
                <td className="px-3 py-2 text-[13px] text-slate-700 font-medium text-right">
                  {wo.targetQuantity || wo.quantity || 0}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={wo.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 text-right">
        <Link to="/work-orders" className="text-[12px] font-medium text-indigo-600 hover:underline">
          View all work orders →
        </Link>
      </div>
    </div>
  );
};

export default ActiveWorkOrdersTable;
