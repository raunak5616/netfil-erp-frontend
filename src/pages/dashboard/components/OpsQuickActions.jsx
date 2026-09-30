import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const ActionBtn = ({ to, label, hasPermission }) => {
  if (!hasPermission) return null;
  
  return (
    <Link 
      to={to} 
      className="flex items-center justify-between w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded text-[13px] font-medium hover:bg-slate-50 hover:border-indigo-300 transition-colors shadow-sm mb-2"
    >
      <span>{label}</span>
      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
    </Link>
  );
};

const OpsQuickActions = () => {
  const { hasPermission } = useAuth();

  return (
    <div className="bg-slate-50 border border-slate-200 rounded p-4 h-[250px] flex flex-col justify-center">
      <ActionBtn 
        to="/sales-orders" 
        label="Create Sales Order"
        hasPermission={hasPermission('SALES_ORDER_CREATE')}
      />
      <ActionBtn 
        to="/quotations" 
        label="Create Quotation"
        hasPermission={hasPermission('QUOTATION_CREATE')}
      />
      <ActionBtn 
        to="/work-orders" 
        label="Create Work Order"
        hasPermission={hasPermission('WORK_ORDER_CREATE')}
      />
      <ActionBtn 
        to="/clients" 
        label="Add New Client"
        hasPermission={hasPermission('CLIENT_CREATE')}
      />
      
      {(!hasPermission('SALES_ORDER_CREATE') && 
        !hasPermission('QUOTATION_CREATE') && 
        !hasPermission('WORK_ORDER_CREATE') && 
        !hasPermission('CLIENT_CREATE')) && (
          <div className="text-center text-slate-500 text-xs py-4">No actions available</div>
      )}
    </div>
  );
};

export default OpsQuickActions;
