import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const actions = [
    { label: 'New PR', path: '/purchase-requisitions/create', permission: 'PURCHASE_REQUISITION_CREATE' },
    { label: 'New PE', path: '/purchase-enquiries/create', permission: 'PURCHASE_ENQUIRY_CREATE' },
    { label: 'New PO', path: '/purchase-orders/create', permission: 'PURCHASE_ORDER_CREATE' },
    { label: 'New GRN', path: '/goods-receipts/create', permission: 'GOODS_RECEIPT_CREATE' },
    { label: 'New Supplier', path: '/suppliers/create', permission: 'SUPPLIER_CREATE' },
  ];

  const visibleActions = actions.filter(a => hasPermission(a.permission));

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-3">
      {visibleActions.length === 0 ? (
        <div className="text-xs text-slate-500 py-1">No quick actions available.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
            {visibleActions.map((action, idx) => (
                <Button
                    key={idx}
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    iconPosition="left"
                    onClick={() => navigate(action.path)}
                >
                    {action.label}
                </Button>
            ))}
        </div>
      )}
    </div>
  );
};

export default QuickActions;
