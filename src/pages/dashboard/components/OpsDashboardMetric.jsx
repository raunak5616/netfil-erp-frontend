import React from 'react';
import { Link } from 'react-router-dom';

const OpsDashboardMetric = ({ label, value, subtext, link, hasPermission }) => {
  if (!hasPermission) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded p-4 opacity-60">
        <div className="text-[11px] font-medium text-slate-500 mb-1">{label}</div>
        <div className="text-[24px] font-bold text-slate-400 mb-1">—</div>
        <div className="text-[10px] text-slate-400">{subtext}</div>
      </div>
    );
  }

  const content = (
    <div className="bg-white border border-slate-200 rounded p-4 hover:border-indigo-400 hover:shadow-sm transition-all h-full group">
      <div className="text-[11px] font-medium text-slate-600 mb-1 group-hover:text-indigo-600 transition-colors">{label}</div>
      <div className="text-[24px] font-bold text-slate-800 mb-1 leading-tight">{value !== undefined ? value : '-'}</div>
      <div className="text-[10px] text-slate-500">{subtext}</div>
    </div>
  );

  if (link && link !== '#') {
    return (
      <Link to={link} className="block no-underline h-full">
        {content}
      </Link>
    );
  }

  return content;
};

export default OpsDashboardMetric;
