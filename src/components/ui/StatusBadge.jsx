import React from 'react';

const StatusBadge = ({ status = 'neutral', label, className = '' }) => {
  const normalizedStatus = (status || 'neutral').toLowerCase().replace(/[\s_]+/g, '-');
  
  const statusMap = {
    'active': 'status-badge-active',
    'approved': 'status-badge-approved',
    'completed': 'status-badge-completed',
    'confirmed': 'status-badge-approved',
    'released': 'status-badge-approved',
    'won': 'status-badge-approved',
    'inactive': 'status-badge-inactive',
    'rejected': 'status-badge-rejected',
    'cancelled': 'status-badge-cancelled',
    'pending': 'status-badge-pending',
    'draft': 'status-badge-draft',
    'warning': 'status-badge-warning',
    'in-progress': 'status-badge-in-progress',
    'info': 'status-badge-info',
    'sent': 'status-badge-info',
    'quoted': 'status-badge-info'
  };
  
  const statusClass = statusMap[normalizedStatus] || 'status-badge-neutral';

  const displayLabel = label || status?.replace(/_/g, ' ') || 'Unknown';

  return (
    <span className={`status-badge ${statusClass} ${className}`} style={{ textTransform: 'capitalize' }}>
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
