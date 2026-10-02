import React, { useState, useEffect, useMemo } from 'react';
import AsyncReactSelect from 'react-select/async';

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

const baseFieldClasses = 'w-full text-xs outline-none';
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
    control: (base, state) => ({
      ...base,
      minHeight: '36px',
      backgroundColor: disabled ? '#f8fafc' : 'white',
      borderColor: hasError ? '#dc2626' : state.isFocused ? '#2563eb' : '#cbd5e1',
      boxShadow: state.isFocused ? (hasError ? '0 0 0 2px #fee2e2' : '0 0 0 2px #dbeafe') : 'none',
      '&:hover': {
        borderColor: hasError ? '#dc2626' : state.isFocused ? '#2563eb' : '#cbd5e1'
      },
      borderRadius: '0.375rem',
      fontSize: '0.75rem',
      padding: '0',
      cursor: disabled ? 'not-allowed' : 'text',
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
  };

  const formatOptionLabel = (option) => (
    <div className="flex flex-col">
      <span className={`font-semibold ${option.value === selectedOption?.value ? 'text-white' : 'text-slate-800'}`}>
        {option.label}
      </span>
      {option.secondaryLabel && (
        <span className={`text-[10px] ${option.value === selectedOption?.value ? 'text-blue-100' : 'text-slate-500'}`}>
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
      isClearable={!required}
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
