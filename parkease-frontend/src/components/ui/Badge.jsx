import React from 'react';

/**
 * Badge component for status labels
 *
 * Props:
 *  variant → green | red | blue | yellow | gray | purple | orange
 *  size    → sm | md
 *  dot     → shows colored dot
 */
const Badge = ({
  children,
  variant   = 'gray',
  size      = 'md',
  dot       = false,
  className = '',
}) => {

  const variants = {
    green:  'bg-emerald-100 text-emerald-700',
    red:    'bg-red-100 text-red-700',
    blue:   'bg-blue-100 text-blue-700',
    yellow: 'bg-amber-100 text-amber-700',
    gray:   'bg-slate-100 text-slate-600',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  };

  const dotColors = {
    green:  'bg-emerald-500',
    red:    'bg-red-500',
    blue:   'bg-blue-500',
    yellow: 'bg-amber-500',
    gray:   'bg-slate-400',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    indigo: 'bg-indigo-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium rounded-full
        ${variants[variant] || variants.gray}
        ${sizes[size] || sizes.md}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`
            w-1.5 h-1.5 rounded-full flex-shrink-0
            ${dotColors[variant] || dotColors.gray}
          `}
        />
      )}
      {children}
    </span>
  );
};

// ── Status → variant mapping helpers ──────────────────────────
export const BookingStatusBadge = ({ status }) => {
  const map = {
    RESERVED:  { variant: 'blue',   label: 'Reserved'  },
    ACTIVE:    { variant: 'green',  label: 'Active'    },
    COMPLETED: { variant: 'gray',   label: 'Completed' },
    CANCELLED: { variant: 'red',    label: 'Cancelled' },
  };
  const config = map[status] || { variant: 'gray', label: status };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
};

export const LotStatusBadge = ({ status }) => {
  const map = {
    PENDING:   { variant: 'yellow', label: 'Pending'   },
    APPROVED:  { variant: 'green',  label: 'Approved'  },
    REJECTED:  { variant: 'red',    label: 'Rejected'  },
    SUSPENDED: { variant: 'gray',   label: 'Suspended' },
  };
  const config = map[status] || { variant: 'gray', label: status };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
};

export const PaymentStatusBadge = ({ status }) => {
  const map = {
    ORDER_CREATED:       { variant: 'yellow', label: 'Pending'    },
    PENDING:             { variant: 'yellow', label: 'Pending'    },
    PAID:                { variant: 'green',  label: 'Paid'       },
    FAILED:              { variant: 'red',    label: 'Failed'     },
  };
  const config = map[status] || { variant: 'gray', label: status };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
};

export const SpotStatusBadge = ({ status }) => {
  const map = {
    AVAILABLE:   { variant: 'green',  label: 'Available'   },
    RESERVED:    { variant: 'yellow', label: 'Reserved'    },
    OCCUPIED:    { variant: 'red',    label: 'Occupied'    },
    MAINTENANCE: { variant: 'gray',   label: 'Maintenance' },
  };
  const config = map[status] || { variant: 'gray', label: status };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
};

export default Badge;