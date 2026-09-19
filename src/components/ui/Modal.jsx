import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const sizeMap = {
  sm: '440px',
  md: '540px',
  lg: '760px',
  xl: '1000px',
  '2xl': '1200px',
  full: '95vw',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  maxWidth,
  size = 'md',
}) => {
  const effectiveMaxWidth = maxWidth || sizeMap[size] || sizeMap.md;

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col border border-slate-200 w-full"
        style={{ maxWidth: effectiveMaxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4.5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            onClick={onClose}
            title="Close Modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4.5 overflow-y-auto flex-1">{children}</div>

        {footer && <div className="px-4.5 py-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-lg">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
