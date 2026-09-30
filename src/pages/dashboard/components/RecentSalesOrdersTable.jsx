import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../../components/ui/StatusBadge';

const RecentSalesOrdersTable = ({ orders }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded p-6 text-center">
        <p className="text-sm font-medium text-slate-700 m-0">No recent sales orders</p>
        <p className="text-xs text-slate-500 mt-1 mb-3">There are no sales orders to display.</p>
        <Link to="/sales-orders" className="inline-block px-3 py-1.5 bg-indigo-600 text-white text-[12px] font-medium rounded hover:bg-indigo-700">
          Create Sales Order
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
              <th className="px-3 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Order Number</th>
              <th className="px-3 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Client</th>
              <th className="px-3 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Date</th>
              <th className="px-3 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right">Value</th>
              <th className="px-3 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((so, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2 text-[13px] text-indigo-600 font-medium">
                  <Link to={`/sales-orders/${so._id}`} className="hover:underline">{so.salesOrderNumber}</Link>
                </td>
                <td className="px-3 py-2 text-[13px] text-slate-600 truncate max-w-[150px]" title={so.client?.clientName || so.clientNameSnapshot}>
                  {so.client?.clientName || so.clientNameSnapshot || '—'}
                </td>
                <td className="px-3 py-2 text-[13px] text-slate-500">
                  {new Date(so.orderDate || so.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-[13px] text-slate-700 font-medium text-right">
                  ₹{(so.totalAmount || so.orderValue || 0).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={so.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 text-right">
        <Link to="/sales-orders" className="text-[12px] font-medium text-indigo-600 hover:underline">
          View all sales orders →
        </Link>
      </div>
    </div>
  );
};

export default RecentSalesOrdersTable;
