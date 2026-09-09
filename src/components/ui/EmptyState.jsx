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
    <div className={`empty-state ${className}`}>
      <Icon size={36} />
      <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-800)', marginTop: '6px' }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: '12.5px', color: 'var(--neutral-500)', marginTop: '4px', maxWidth: '360px', margin: '4px auto 0' }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '14px' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
