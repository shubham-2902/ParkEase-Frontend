import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState component
 */
const EmptyState = ({
  icon,
  title     = 'Nothing here yet',
  message   = '',
  action,
  actionLabel,
  className = '',
}) => {

  return (
    <div className={`flex flex-col items-center justify-center
                     py-16 px-8 text-center ${className}`}>

      <div className="w-16 h-16 rounded-2xl bg-slate-100
                      flex items-center justify-center mb-4
                      text-slate-400">
        {icon || <PackageOpen className="w-8 h-8" />}
      </div>

      <h3 className="text-slate-900 font-semibold text-base mb-1">
        {title}
      </h3>

      {message && (
        <p className="text-slate-500 text-sm max-w-xs mb-6">
          {message}
        </p>
      )}

      {action && actionLabel && (
        <Button onClick={action} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;