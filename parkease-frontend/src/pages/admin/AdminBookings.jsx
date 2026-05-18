import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, Filter } from 'lucide-react';
import bookingApi from '../../api/bookingApi';
import Table      from '../../components/ui/Table';
import Button     from '../../components/ui/Button';
import Alert      from '../../components/ui/Alert';
import StatCard   from '../../components/ui/StatCard';
import { BookingStatusBadge } from '../../components/ui/Badge';
import {
  formatDateTime,
  formatCurrency,
  getErrorMessage,
} from '../../utils/helpers';

const STATUSES = ['RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

const AdminBookings = () => {
  const [bookings,     setBookings]     = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [alert,        setAlert]        = useState(null);

  const loadBookings = async (status) => {
    setLoading(true);
    try {
      let res;
      if (status && status !== 'ALL') {
        res = await bookingApi.getBookingsByStatus(status);
      } else {
        // Load all by fetching each status
        const results = await Promise.allSettled(
          STATUSES.map(s => bookingApi.getBookingsByStatus(s))
        );
        const allBks = results
          .filter(r => r.status === 'fulfilled')
          .flatMap(r => r.value.data || []);
        setBookings(allBks);
        setFiltered(allBks);
        setLoading(false);
        return;
      }
      const bks = res.data || [];
      setBookings(bks);
      setFiltered(bks);
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings('ALL'); }, []);

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    loadBookings(status);
  };

  const stats = {
    total:     bookings.length,
    active:    bookings.filter(b => b.status === 'ACTIVE').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
    revenue:   bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((s, b) => s + (b.totalFare || 0), 0),
  };

  const columns = [
    {
      key:   'id',
      label: 'Booking ID',
      render: (v) => (
        <span className="font-mono text-sm">#{v}</span>
      ),
    },
    {
      key:   'userId',
      label: 'User',
      render: (v) => `User #${v}`,
    },
    {
      key:   'lotId',
      label: 'Lot / Spot',
      render: (v, row) => (
        <div>
          <p className="text-sm">Lot #{v}</p>
          <p className="text-xs text-slate-400">
            Spot #{row.spotId}
          </p>
        </div>
      ),
    },
    {
      key:   'vehiclePlate',
      label: 'Vehicle',
    },
    {
      key:   'bookingType',
      label: 'Type',
      render: (v) => (
        <span className="capitalize text-xs text-slate-600">
          {v?.replace('_', ' ')?.toLowerCase()}
        </span>
      ),
    },
    {
      key:   'startTime',
      label: 'Start Time',
      render: (v) => formatDateTime(v),
    },
    {
      key:   'totalFare',
      label: 'Fare',
      render: (v) => v ? formatCurrency(v) : '—',
    },
    {
      key:   'status',
      label: 'Status',
      render: (v) => <BookingStatusBadge status={v} />,
    },
  ];

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            All Bookings
          </h1>
          <p className="text-slate-500 mt-1">
            Platform-wide booking management
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={() => loadBookings('ALL')}
        >
          Refresh
        </Button>
      </div>

      {alert && (
        <Alert
          variant={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',     value: stats.total,                color: 'slate'   },
          { label: 'Active',    value: stats.active,               color: 'emerald' },
          { label: 'Completed', value: stats.completed,            color: 'blue'    },
          { label: 'Cancelled', value: stats.cancelled,            color: 'red'     },
          { label: 'Revenue',   value: formatCurrency(stats.revenue), color: 'amber' },
        ].map(({ label, value, color }) => {
          const colors = {
            slate:   { bg: 'bg-slate-50',   text: 'text-slate-900'   },
            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
            blue:    { bg: 'bg-blue-50',    text: 'text-blue-700'    },
            red:     { bg: 'bg-red-50',     text: 'text-red-700'     },
            amber:   { bg: 'bg-amber-50',   text: 'text-amber-700'   },
          };
          const c = colors[color];
          return (
            <div key={label}
                 className={`${c.bg} rounded-xl p-3 text-center`}>
              <p className={`font-bold text-lg ${c.text}`}>
                {value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', ...STATUSES].map((status) => (
          <button
            key={status}
            onClick={() => handleFilterChange(status)}
            className={`
              px-3 py-1.5 rounded-xl text-xs font-medium
              transition-colors
              ${statusFilter === status
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }
            `}
          >
            {status === 'ALL' ? 'All' : status.charAt(0) +
             status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMsg="No bookings found"
      />
    </div>
  );
};

export default AdminBookings;