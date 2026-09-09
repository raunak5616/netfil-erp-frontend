import React from 'react';

const StatusBadge = ({ status = 'neutral', label, className = '' }) => {
  const normalizedStatus = (status || 'neutral').toLowerCase().replace(/\s+/g, '-');
  
  const validStatuses = [
    'active', 'inactive', 'pending', 'draft', 
    'approved', 'rejected', 'completed', 'cancelled', 'in-progress'
  ];
  
  const statusClass = validStatuses.includes(normalizedStatus)
    ? `status-badge-${normalizedStatus}`
    : 'status-badge-neutral';

  const displayLabel = label || status || 'Unknown';

  return (
    <span className={`status-badge ${statusClass} ${className}`}>
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
