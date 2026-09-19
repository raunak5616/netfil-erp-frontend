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
  const typeClasses = {
    danger: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const icons = {
    danger: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[type] || Info;
  const alertClass = typeClasses[type] || typeClasses.info;

  return (
    <div className={`p-3 rounded mb-3.5 text-xs flex items-start gap-2.5 border ${alertClass} ${className}`} style={style}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div>{message || children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="bg-transparent border-0 cursor-pointer text-current opacity-70 hover:opacity-100 p-0.5 transition-opacity"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Alert;
