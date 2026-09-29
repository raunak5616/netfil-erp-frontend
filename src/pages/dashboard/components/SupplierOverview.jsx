import React from 'react';
import { useNavigate } from 'react-router-dom';

const SupplierOverview = ({ kpis, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-3 text-xs text-slate-800">
      {loading ? (
        <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-100 rounded w-full"></div>
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="font-semibold text-slate-700">Active Suppliers:</span>
             <span className="font-bold">{kpis.supActive}</span>
          </div>
          {kpis.supRecent && kpis.supRecent.length > 0 && (
             <div className="mb-2">
                <span className="font-semibold text-slate-700 block mb-1">Recently Added:</span>
                <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                   {kpis.supRecent.slice(0, 3).map((sup, idx) => (
                      <li key={idx} className="truncate">{sup.supplierName}</li>
                   ))}
                </ul>
             </div>
          )}
          <button 
            onClick={() => navigate('/suppliers')}
            className="text-blue-700 font-medium hover:underline mt-1"
          >
            View All Suppliers &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

export default SupplierOverview;
