import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display matching your criteria.',
  action = null,
  className = '',
}) => {
  return (
    <div className={`text-center py-9 px-5 text-slate-500 flex flex-col items-center justify-center ${className}`}>
      <Icon size={36} className="mx-auto text-slate-400 mb-2 opacity-50" />
      <p className="font-semibold text-sm text-slate-800 mt-1.5">
        {title}
      </p>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
};

export default EmptyState;
