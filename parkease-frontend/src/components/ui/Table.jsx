import React from 'react';
import { SkeletonRow } from './Spinner';

/**
 * Table component
 *
 * Props:
 *  columns  → [{ key, label, render?, className? }]
 *  data     → array of row objects
 *  loading  → shows skeleton rows
 *  emptyMsg → message when no data
 */
const Table = ({
  columns,
  data       = [],
  loading    = false,
  emptyMsg   = 'No data available',
  className  = '',
}) => {

  return (
    <div className="overflow-x-auto rounded-xl border
                    border-slate-100">
      <table className={`w-full text-sm ${className}`}>

        {/* Header */}
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  px-4 py-3 text-left font-semibold
                  text-slate-600 whitespace-nowrap
                  ${col.className || ''}
                `}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-slate-50 bg-white">

          {/* Loading skeleton */}
          {loading && (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))
          )}

          {/* Empty state */}
          {!loading && data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center
                           text-slate-400 text-sm"
              >
                {emptyMsg}
              </td>
            </tr>
          )}

          {/* Data rows */}
          {!loading && data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className="hover:bg-slate-50/80 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`
                    px-4 py-3 text-slate-700
                    whitespace-nowrap
                    ${col.cellClassName || ''}
                  `}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key] ?? '—'
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;