import React, { forwardRef } from 'react';

/**
 * Input component
 *
 * Props:
 *  label       → field label
 *  error       → error message string
 *  hint        → helper text below input
 *  leftIcon    → icon on left side
 *  rightIcon   → icon on right side
 *  required    → shows asterisk
 */
const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  required  = false,
  className = '',
  type      = 'text',
  ...props
}, ref) => {

  return (
    <div className="w-full">

      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && (
            <span className="text-red-500 ml-0.5">*</span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">

        {/* Left icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3
                          flex items-center pointer-events-none
                          text-slate-400">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          className={`
            w-full rounded-lg border bg-white text-sm
            text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2
            focus:ring-blue-500 focus:border-transparent
            transition-shadow duration-150
            disabled:bg-slate-50 disabled:cursor-not-allowed
            ${leftIcon  ? 'pl-10'  : 'pl-3.5'}
            ${rightIcon ? 'pr-10'  : 'pr-3.5'}
            py-2.5
            ${error
              ? 'border-red-300 focus:ring-red-400'
              : 'border-slate-200'
            }
            ${className}
          `}
          {...props}
        />

        {/* Right icon */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3
                          flex items-center text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}

      {/* Hint text */}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// ── Select variant ─────────────────────────────────────────────
export const Select = forwardRef(({
  label,
  error,
  hint,
  required  = false,
  children,
  className = '',
  ...props
}, ref) => {

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <select
        ref={ref}
        className={`
          w-full px-3.5 py-2.5 rounded-lg border bg-white
          text-sm text-slate-900
          focus:outline-none focus:ring-2 focus:ring-blue-500
          focus:border-transparent transition-shadow duration-150
          disabled:bg-slate-50 disabled:cursor-not-allowed
          ${error ? 'border-red-300' : 'border-slate-200'}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// ── Textarea variant ───────────────────────────────────────────
export const Textarea = forwardRef(({
  label,
  error,
  hint,
  required  = false,
  rows      = 3,
  className = '',
  ...props
}, ref) => {

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-3.5 py-2.5 rounded-lg border bg-white
          text-sm text-slate-900 placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-500
          focus:border-transparent transition-shadow duration-150
          resize-none
          ${error ? 'border-red-300' : 'border-slate-200'}
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;