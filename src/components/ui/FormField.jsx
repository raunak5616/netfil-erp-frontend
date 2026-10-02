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

import ReactSelect, { components } from 'react-select';
import { ChevronDown, X } from 'lucide-react';

const CustomDropdownIndicator = (props) => {
  const isOpen = props.selectProps.menuIsOpen;
  const isSm = props.selectProps.size === 'sm';
  return (
    <components.DropdownIndicator {...props}>
      <div
        className={`flex items-center justify-center border-l transition-colors ${
          isSm ? 'px-1.5' : 'px-2.5'
        } h-full ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-800'
        }`}
      >
        <ChevronDown
          size={isSm ? 12 : 14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
    </components.DropdownIndicator>
  );
};

const CustomClearIndicator = (props) => {
  return (
    <components.ClearIndicator {...props}>
      <div className="p-1 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
        <X size={13} />
      </div>
    </components.ClearIndicator>
  );
};

export const Select = ({ hasError, className = '', children, value, onChange, disabled, required, size, ...props }) => {
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

  const isCurrentlyClearable = !required && selectedOption && selectedOption.value !== 'all' && selectedOption.value !== '';

  const customStyles = {
    container: (base) => ({
      ...base,
      ...(props.style?.width ? { width: props.style.width } : {}),
      ...(props.style?.minWidth ? { minWidth: props.style.minWidth } : {}),
      ...(props.style?.maxWidth ? { maxWidth: props.style.maxWidth } : {}),
    }),
    control: (base, state) => ({
      ...base,
      minHeight: size === 'sm' ? '28px' : '36px',
      height: size === 'sm' ? '28px' : '36px',
      backgroundColor: disabled ? '#f8fafc' : 'white',
      borderColor: hasError ? '#dc2626' : state.isFocused ? '#2563eb' : '#cbd5e1',
      boxShadow: state.isFocused ? (hasError ? '0 0 0 2px #fee2e2' : '0 0 0 2px #dbeafe') : 'none',
      '&:hover': {
        borderColor: hasError ? '#dc2626' : state.isFocused ? '#2563eb' : '#cbd5e1'
      },
      borderRadius: '0.375rem',
      fontSize: size === 'sm' ? '0.7rem' : '0.75rem',
      padding: '0',
      overflow: 'hidden',
      cursor: disabled ? 'not-allowed' : 'default',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: size === 'sm' ? '0 6px' : '0 10px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: '100%',
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
    indicatorSeparator: (base) => ({
      ...base,
      display: 'none'
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: '0 4px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer'
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: '0',
      height: '100%',
      display: 'flex',
      alignItems: 'center'
    }),
  };

  return (
    <ReactSelect
      value={selectedOption}
      onChange={handleChange}
      options={options}
      isDisabled={disabled}
      styles={customStyles}
      components={{ 
        IndicatorSeparator: () => null,
        DropdownIndicator: CustomDropdownIndicator,
        ClearIndicator: CustomClearIndicator
      }}
      isSearchable={true}
      isClearable={isCurrentlyClearable}
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
