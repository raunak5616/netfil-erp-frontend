import React from 'react';

export const FormField = ({
  label,
  required = false,
  error = '',
  helperText = '',
  children,
  fullWidth = false,
  className = '',
}) => {
  return (
    <div className={`form-group ${fullWidth ? 'full-width' : ''} ${className}`}>
      {label && (
        <label className="form-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      {children}
      {error && <span className="form-error">{error}</span>}
      {!error && helperText && <span className="form-helper">{helperText}</span>}
    </div>
  );
};

export const Input = ({ hasError, className = '', ...props }) => {
  return (
    <input
      className={`form-input ${hasError ? 'has-error' : ''} ${className}`}
      {...props}
    />
  );
};

export const Select = ({ hasError, className = '', children, ...props }) => {
  return (
    <select
      className={`form-select ${hasError ? 'has-error' : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

export const Textarea = ({ hasError, className = '', rows = 3, ...props }) => {
  return (
    <textarea
      className={`form-textarea ${hasError ? 'has-error' : ''} ${className}`}
      rows={rows}
      {...props}
    />
  );
};
