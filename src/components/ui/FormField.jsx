import React from 'react';

export const FormField = ({
  label,
  required = false,
  error = '',
  helperText = '',
  children,
  fullWidth = false,
  className = '',
  style,
}) => {
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-full' : ''} ${className}`} style={style}>
      {label && (
        <label className="block font-semibold text-[12.5px] text-slate-700">
          {label} {required && <span className="text-red-600 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <span className="text-[11.5px] text-red-600 mt-0.5">{error}</span>}
      {!error && helperText && <span className="text-[11.5px] text-slate-500 mt-0.5">{helperText}</span>}
    </div>
  );
};

const baseFieldClasses = 'w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed';
const errorFieldClasses = 'border-red-600 bg-red-50 focus:ring-red-100';

export const Input = ({ hasError, className = '', ...props }) => {
  return (
    <input
      className={`${baseFieldClasses} ${hasError ? errorFieldClasses : ''} ${className}`}
      {...props}
    />
  );
};

export const Select = ({ hasError, className = '', children, ...props }) => {
  return (
    <select
      className={`${baseFieldClasses} ${hasError ? errorFieldClasses : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

export const Textarea = ({ hasError, className = '', rows = 3, ...props }) => {
  return (
    <textarea
      className={`${baseFieldClasses} ${hasError ? errorFieldClasses : ''} ${className}`}
      rows={rows}
      {...props}
    />
  );
};
