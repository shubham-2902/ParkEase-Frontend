import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Spinner / Loading states
 */

// ── Inline spinner ─────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <Loader2
      className={`animate-spin text-blue-600
                  ${sizes[size] || sizes.md}
                  ${className}`}
    />
  );
};

// ── Full page loader ───────────────────────────────────────────
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex flex-col items-center
                  justify-center gap-4 bg-slate-50">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-4
                      border-blue-100 border-t-blue-600
                      animate-spin" />
    </div>
    <p className="text-slate-500 text-sm font-medium animate-pulse">
      {message}
    </p>
  </div>
);

// ── Section loader ─────────────────────────────────────────────
export const SectionLoader = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center
                  py-16 gap-3">
    <Spinner size="lg" />
    <p className="text-slate-400 text-sm">{message}</p>
  </div>
);

// ── Skeleton card ──────────────────────────────────────────────
export const SkeletonCard = ({ lines = 3 }) => (
  <div className="card animate-pulse">
    <div className="h-4 bg-slate-200 rounded w-3/4 mb-4" />
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-3 bg-slate-200 rounded mb-2"
        style={{ width: `${100 - i * 15}%` }}
      />
    ))}
  </div>
);

// ── Skeleton table row ─────────────────────────────────────────
export const SkeletonRow = ({ cols = 5 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-3 bg-slate-200 rounded"
             style={{ width: `${60 + Math.random() * 40}%` }} />
      </td>
    ))}
  </tr>
);

export default Spinner;