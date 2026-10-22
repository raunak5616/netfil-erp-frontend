import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  zIndex = 1000,
}) => {
  const effectiveMaxWidth = maxWidth || sizeMap[size] || sizeMap.md;

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      const remainingModals = document.querySelectorAll('[data-netfil-modal="true"]');
      if (remainingModals.length <= 1) {
        document.body.style.overflow = 'unset';
      }
    }
    return () => {
      const remainingModals = document.querySelectorAll('[data-netfil-modal="true"]');
      if (remainingModals.length <= 1) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      style={{ zIndex }}
      data-netfil-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col border border-slate-200/90 w-full animate-scaleUp overflow-hidden"
        style={{ maxWidth: effectiveMaxWidth }}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/95 rounded-t-2xl shrink-0">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer border border-transparent hover:border-slate-200 shrink-0"
            onClick={onClose}
            title="Close Modal"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/80 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default Modal;
