import React from 'react';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';

const PendingActions = ({ actions, loading }) => {
  const navigate = useNavigate();

  const columns = [
    { 
      header: 'Document', 
      key: 'module',
      render: (val) => <span className="font-medium text-slate-800">{val}</span>
    },
    { 
      header: 'Reference', 
      key: 'referenceNumber', 
      render: (val, row) => <span className="font-medium text-blue-700 cursor-pointer hover:underline" onClick={() => navigate(row.path)}>{val}</span>
    },
    { 
      header: 'Supplier / Dept', 
      key: 'supplier',
      render: (val) => val || '—'
    },
    { 
      header: 'Date', 
      key: 'date'
    },
    { 
      header: 'Status', 
      key: 'status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      header: 'Action',
      key: 'action',
      render: (_, row) => (
        <button 
          onClick={() => navigate(row.path)}
          className="text-xs text-blue-700 font-medium hover:underline"
        >
          View
        </button>
      )
    }
  ];

  return (
    <DataTable 
      columns={columns}
      data={actions}
      loading={loading}
      emptyTitle="No pending work"
      emptyDescription=""
    />
  );
};

export default PendingActions;
