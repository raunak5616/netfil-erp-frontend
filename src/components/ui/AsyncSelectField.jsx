import React, { useState, useEffect, useMemo } from 'react';
import AsyncReactSelect from 'react-select/async';
import { components } from 'react-select';
import { ChevronDown, X } from 'lucide-react';

const CustomDropdownIndicator = (props) => {
  const isOpen = props.selectProps.menuIsOpen;
  return (
    <components.DropdownIndicator {...props}>
      <div
        className={`flex items-center justify-center px-2.5 h-full border-l transition-colors ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-800'
        }`}
      >
        <ChevronDown
          size={14}
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

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const baseFieldClasses = 'text-xs outline-none';
const errorFieldClasses = 'border-red-600 bg-red-50 focus:ring-red-100';

export const AsyncSelect = ({
  hasError,
  className = '',
  value,
  onChange,
  loadOptions, // (inputValue) => Promise<Array<{value, label, secondaryLabel}>>
  defaultOptions = true,
  disabled,
  required,
  initialLabel,
  initialSecondaryLabel,
  placeholder = "Search and select...",
  ...props
}) => {
  const [selectedOption, setSelectedOption] = useState(null);

  // Sync selectedOption with incoming value prop
  useEffect(() => {
    if (value) {
      if (!selectedOption || String(selectedOption.value) !== String(value)) {
        setSelectedOption({ 
          value, 
          label: initialLabel || value,
          secondaryLabel: initialSecondaryLabel
        });
      }
    } else {
      setSelectedOption(null);
    }
  }, [value, initialLabel, initialSecondaryLabel]);

  const handleChange = (selected) => {
    setSelectedOption(selected);
    if (onChange) {
      const mockEvent = {
        target: {
          value: selected ? selected.value : '',
          name: props.name
        }
      };
      onChange(mockEvent, selected);
    }
  };

  // Debounced option loading
  const debouncedFetch = useMemo(() => {
    return debounce((inputValue, callback) => {
      loadOptions(inputValue).then(options => callback(options)).catch(() => callback([]));
    }, 300);
  }, [loadOptions]);

  const handleLoadOptions = (inputValue, callback) => {
    if (!inputValue && typeof defaultOptions !== 'boolean' && !defaultOptions) {
       // if not searching and defaultOptions is false/array, react-select handles it.
    }
    debouncedFetch(inputValue, callback);
  };

  const customStyles = {
    container: (base) => ({
      ...base,
      ...(props.style?.width ? { width: props.style.width } : {}),
      ...(props.style?.minWidth ? { minWidth: props.style.minWidth } : {}),
      ...(props.style?.maxWidth ? { maxWidth: props.style.maxWidth } : {}),
    }),
    control: (base, state) => ({
      ...base,
      minHeight: '36px',
      height: '36px',
      backgroundColor: disabled ? '#f8fafc' : 'white',
      borderColor: hasError ? '#dc2626' : state.isFocused ? '#2563eb' : '#cbd5e1',
      boxShadow: state.isFocused ? (hasError ? '0 0 0 2px #fee2e2' : '0 0 0 2px #dbeafe') : 'none',
      '&:hover': {
        borderColor: hasError ? '#dc2626' : state.isFocused ? '#2563eb' : '#cbd5e1'
      },
      borderRadius: '0.375rem',
      fontSize: '0.75rem',
      padding: '0',
      overflow: 'hidden',
      cursor: disabled ? 'not-allowed' : 'text',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 10px',
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
      padding: '6px 10px',
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
      maxHeight: '280px',
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '280px',
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

  const isCurrentlyClearable = !required && selectedOption && selectedOption.value !== 'all' && selectedOption.value !== '';

  const formatOptionLabel = (option, { context }) => (
    <div className="flex flex-col">
      <span className={`font-semibold ${context === 'menu' && option.value === selectedOption?.value ? 'text-white' : 'text-slate-800'}`}>
        {option.label}
      </span>
      {option.secondaryLabel && (
        <span className={`text-[10px] ${context === 'menu' && option.value === selectedOption?.value ? 'text-blue-100' : 'text-slate-500'}`}>
          {option.secondaryLabel}
        </span>
      )}
    </div>
  );

  return (
    <AsyncReactSelect
      value={selectedOption}
      onChange={handleChange}
      loadOptions={handleLoadOptions}
      defaultOptions={defaultOptions}
      isDisabled={disabled}
      styles={customStyles}
      components={{ 
        IndicatorSeparator: () => null,
        DropdownIndicator: CustomDropdownIndicator,
        ClearIndicator: CustomClearIndicator
      }}
      isClearable={isCurrentlyClearable}
      className={`${baseFieldClasses} ${className}`}
      placeholder={placeholder}
      menuPortalTarget={document.body}
      menuPosition="fixed"
      formatOptionLabel={formatOptionLabel}
      noOptionsMessage={({ inputValue }) => !inputValue ? "Type to search..." : "No matching records found"}
      loadingMessage={() => "Searching..."}
      {...props}
    />
  );
};
