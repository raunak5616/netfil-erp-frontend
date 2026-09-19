import React from 'react';

const Button = ({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  type = 'button',
  className = '',
  onClick,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-blue-700 text-white border-transparent hover:bg-blue-800 active:bg-blue-900',
    secondary: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400',
    outline: 'bg-transparent text-blue-700 border-blue-700 hover:bg-blue-50',
    danger: 'bg-red-700 text-white border-transparent hover:bg-red-800',
    ghost: 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900',
  };

  const sizeClasses = {
    xs: 'px-1.5 py-1 text-[11px]',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-xs',
    lg: 'px-4 py-2.5 text-sm',
  };

  const baseClasses = 'inline-flex items-center justify-center gap-1.5 font-medium rounded leading-snug border transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed whitespace-nowrap';
  const variantClass = variantClasses[variant] || variantClasses.secondary;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
      ) : (
        Icon && iconPosition === 'left' && <Icon size={size === 'sm' || size === 'xs' ? 14 : 16} />
      )}

      <span>{children}</span>

      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' || size === 'xs' ? 14 : 16} />}
    </button>
  );
};

export default Button;
