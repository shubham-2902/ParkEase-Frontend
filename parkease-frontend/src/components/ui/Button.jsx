import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button component
 *
 * Props:
 *  variant  → primary | secondary | danger | success | ghost
 *  size     → sm | md | lg
 *  loading  → shows spinner
 *  fullWidth→ w-full
 */
const Button = ({
  children,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  fullWidth = false,
  disabled  = false,
  icon,
  type      = 'button',
  onClick,
  className = '',
  ...props
}) => {

  const base = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  const variants = {
    primary:   'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-300',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success:   'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
    ghost:     'text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
    warning:   'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${base}
        ${variants[variant] || variants.primary}
        ${sizes[size]       || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="w-4 h-4">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;