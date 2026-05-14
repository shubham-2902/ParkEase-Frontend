import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

/**
 * Alert component
 *
 * variant → success | error | warning | info
 */
const Alert = ({
  variant   = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {

  const config = {
    success: {
      bg:   'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    },
    error: {
      bg:   'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-600" />,
    },
    warning: {
      bg:   'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    },
    info: {
      bg:   'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600" />,
    },
  };

  const c = config[variant] || config.info;

  return (
    <div className={`
      flex gap-3 p-4 rounded-xl border
      ${onClose ? 'shadow-lg ring-1 ring-black/5' : ''}
      ${c.bg} ${className}
      fixed top-4 left-1/2 -translate-x-1/2 max-w-2xl w-[90%] z-[9999]
      animate-in fade-in slide-in-from-top-4 duration-300
    `}>
      <div className="flex-shrink-0 mt-0.5">
        {c.icon}
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <p className={`font-semibold text-sm ${c.text}`}>
            {title}
          </p>
        )}
        {message && (
          <p className={`text-sm mt-0.5 ${c.text} opacity-90`}>
            {message}
          </p>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${c.text} opacity-60
                      hover:opacity-100 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;