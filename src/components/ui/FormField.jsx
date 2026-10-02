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

import ReactSelect from 'react-select';

export const Select = ({ hasError, className = '', children, value, onChange, disabled, required, ...props }) => {
  const options = [];
  
  const extractOptions = (nodes) => {
    React.Children.toArray(nodes).forEach(child => {
      if (!child) return;
      if (child.type === 'option') {
        options.push({ 
          value: child.props.value, 
          label: child.props.children, 
          disabled: child.props.disabled 
        });
      } else if (child.props && child.props.children) {
        extractOptions(child.props.children);
      }
    });
  };
  
  extractOptions(children);

  const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;

  const handleChange = (selected) => {
    if (onChange) {
      // Mock an event object to not break existing handlers
      const mockEvent = {
        target: {
          value: selected ? selected.value : '',
          name: props.name
        }
      };
      onChange(mockEvent);
    }
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '36px',
      backgroundColor: disabled ? '#f8fafc' : 'white',
      borderColor: hasError ? '#dc2626' : state.isFocused ? '#2563eb' : '#cbd5e1',
      boxShadow: state.isFocused ? (hasError ? '0 0 0 2px #fee2e2' : '0 0 0 2px #dbeafe') : 'none',
      '&:hover': {
        borderColor: hasError ? '#dc2626' : state.isFocused ? '#2563eb' : '#cbd5e1'
      },
      borderRadius: '0.375rem', // rounded-md
      fontSize: '0.75rem', // text-xs
      padding: '0',
      cursor: disabled ? 'not-allowed' : 'default',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 10px',
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: '#1e293b',
    }),
    singleValue: (base, state) => ({
      ...base,
      color: state.isDisabled ? '#64748b' : '#1e293b',
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.75rem',
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#2563eb',
      }
    }),
    menu: (base) => ({
      ...base,
      zIndex: 50,
      borderRadius: '0.375rem',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  return (
    <ReactSelect
      value={selectedOption}
      onChange={handleChange}
      options={options}
      isDisabled={disabled}
      styles={customStyles}
      isSearchable={true}
      isClearable={!required}
      className={className}
      placeholder="Select option..."
      menuPortalTarget={document.body}
      menuPosition="fixed"
      {...props}
    />
  );
};

export { AsyncSelect } from './AsyncSelectField';

export const Textarea = ({ hasError, className = '', rows = 3, ...props }) => {
  return (
    <textarea
      className={`${baseFieldClasses} ${hasError ? errorFieldClasses : ''} ${className}`}
      rows={rows}
      {...props}
    />
  );
};
