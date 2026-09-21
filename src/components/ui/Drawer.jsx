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
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-[1000] flex justify-end animate-fadeIn">
      <div
        className="w-full bg-white h-full flex flex-col shadow-2xl border-l border-slate-200/90 rounded-l-2xl animate-slideInRight overflow-hidden"
        style={{ maxWidth: width }}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/95 shrink-0">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer border border-transparent hover:border-slate-200 shrink-0"
            onClick={onClose}
            title="Close Drawer"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/80 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawer;
