import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="440px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4 items-start py-1">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            variant === 'danger'
              ? 'bg-red-50 text-red-600 border-red-100'
              : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}
        >
          <AlertTriangle size={20} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
