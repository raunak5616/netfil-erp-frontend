import React from 'react';

const StatusBadge = ({ status = 'neutral', label, className = '' }) => {
  const normalizedStatus = (status || 'neutral').toLowerCase().replace(/[\s_]+/g, '-');
  
  const greenBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  const redBadge = 'bg-red-50 text-red-800 border-red-200';
  const amberBadge = 'bg-amber-50 text-amber-800 border-amber-200';
  const skyBadge = 'bg-sky-50 text-sky-700 border-sky-200';
  const purpleBadge = 'bg-purple-50 text-purple-700 border-purple-200';
  const neutralBadge = 'bg-slate-100 text-slate-700 border-slate-200';

  const statusMap = {
    'active': greenBadge,
    'approved': greenBadge,
    'completed': greenBadge,
    'confirmed': greenBadge,
    'released': greenBadge,
    'won': greenBadge,
    'converted': greenBadge,
    'inactive': redBadge,
    'rejected': redBadge,
    'cancelled': redBadge,
    'lost': redBadge,
    'pending': amberBadge,
    'draft': amberBadge,
    'warning': amberBadge,
    'follow-up': purpleBadge,
    'follow_up': purpleBadge,
    'in-progress': skyBadge,
    'info': skyBadge,
    'sent': skyBadge,
    'quoted': skyBadge,
    'response-pending': amberBadge,
    'response_pending': amberBadge,
    'received': purpleBadge,
    'evaluated': greenBadge,
    'closed': neutralBadge
  };
  
  const statusClass = statusMap[normalizedStatus] || neutralBadge;
  const displayLabel = label || status?.replace(/_/g, ' ') || 'Unknown';
  const baseClasses = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11.5px] font-semibold leading-snug capitalize border';

  return (
    <span className={`${baseClasses} ${statusClass} ${className}`}>
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
