import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const Alert = ({
  type = 'info',
  title = '',
  children,
  message,
  onClose,
  className = '',
  style = {},
}) => {
  const alertTypeClass = `alert-${type}`;
  
  const icons = {
    danger: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[type] || Info;

  return (
    <div className={`alert ${alertTypeClass} ${className}`} style={style}>
      <Icon size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: '2px' }}>{title}</div>}
        <div>{message || children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            opacity: 0.7,
            padding: '2px',
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Alert;
