import React from 'react';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';

const RecentPurchaseOrders = ({ orders, loading }) => {
  const navigate = useNavigate();

  const columns = [
    { 
      header: 'PO No.', 
      key: 'poNumber', 
      render: (val, row) => <span className="font-medium text-blue-700 cursor-pointer hover:underline" onClick={() => navigate(`/purchase-orders/${row._id}`)}>{val}</span>
    },
    { 
      header: 'Supplier', 
      key: 'supplierNameSnapshot',
      render: (val) => <span className="truncate max-w-[150px] inline-block" title={val}>{val}</span>
    },
    { 
      header: 'Date', 
      key: 'poDate',
      render: (val) => new Date(val).toLocaleDateString()
    },
    { 
      header: 'Amount', 
      key: 'grandTotal',
      render: (val, row) => `${row.currency || 'INR'} ${Number(val).toLocaleString()}`
    },
    { 
      header: 'Status', 
      key: 'status',
      render: (val) => <StatusBadge status={val} />
    }
  ];

  return (
    <DataTable 
      columns={columns}
      data={orders}
      loading={loading}
      emptyTitle="No purchase orders found."
      emptyDescription=""
    />
  );
};

export default RecentPurchaseOrders;
