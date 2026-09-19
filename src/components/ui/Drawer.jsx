import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  width = '480px',
}) => {
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
    <div className="fixed inset-0 bg-slate-900/40 z-[1000] flex justify-end" onClick={onClose}>
      <div
        className="w-full bg-white h-full flex flex-col shadow-xl border-l border-slate-200"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4.5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4.5 overflow-y-auto flex-1">{children}</div>

        {footer && <div className="px-4.5 py-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">{footer}</div>}
      </div>
    </div>
  );
};

export default Drawer;
