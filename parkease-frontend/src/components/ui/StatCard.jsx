import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StatCard — dashboard metric card
 *
 * Props:
 *  title   → metric label
 *  value   → main value
 *  change  → percentage change (optional)
 *  trend   → 'up' | 'down' | null
 *  icon    → lucide icon component
 *  color   → blue | green | red | purple | amber
 *  loading → skeleton state
 */
const StatCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color   = 'blue',
  loading = false,
  suffix  = '',
  prefix  = '',
}) => {

  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   ring: 'bg-blue-100'   },
    green:  { bg: 'bg-emerald-50',icon: 'text-emerald-600',ring: 'bg-emerald-100'},
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    ring: 'bg-red-100'    },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'bg-purple-100' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  ring: 'bg-amber-100'  },
  };

  const c = colors[color] || colors.blue;

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-20" />
      </div>
    );
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center
                           justify-center ${c.ring}`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
        )}
      </div>

      <p className="text-3xl font-bold text-slate-900 mb-2">
        {prefix}{value}{suffix}
      </p>

      {(change !== undefined || trend) && (
        <div className="flex items-center gap-1.5">
          {trend === 'up' && (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          )}
          {trend === 'down' && (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          {change !== undefined && (
            <span className={`text-sm font-medium ${
              trend === 'up'   ? 'text-emerald-600' :
              trend === 'down' ? 'text-red-600'     :
              'text-slate-500'
            }`}>
              {trend === 'up' ? '+' : ''}{change}%
            </span>
          )}
          <span className="text-xs text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;