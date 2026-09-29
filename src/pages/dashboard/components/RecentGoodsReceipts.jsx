import React from 'react';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';

const RecentGoodsReceipts = ({ grns, loading }) => {
  const navigate = useNavigate();

  const columns = [
    { 
      header: 'GRN No.', 
      key: 'grnNumber', 
      render: (val, row) => <span className="font-medium text-blue-700 cursor-pointer hover:underline" onClick={() => navigate(`/goods-receipts/${row._id}`)}>{val}</span>
    },
    { 
      header: 'PO No.', 
      key: 'poNumberSnapshot',
      render: (val) => val || '—'
    },
    { 
      header: 'Supplier', 
      key: 'supplierNameSnapshot',
      render: (val) => <span className="truncate max-w-[120px] inline-block" title={val}>{val}</span>
    },
    { 
      header: 'Date', 
      key: 'grnDate',
      render: (val) => new Date(val).toLocaleDateString()
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
      data={grns}
      loading={loading}
      emptyTitle="No recent goods receipts."
      emptyDescription=""
    />
  );
};

export default RecentGoodsReceipts;
