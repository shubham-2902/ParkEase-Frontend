import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import parkingLotApi from '../../api/parkingLotApi';
import bookingApi    from '../../api/bookingApi';
import { Select }    from '../../components/ui/Input';
import Table         from '../../components/ui/Table';
import Alert         from '../../components/ui/Alert';
import { BookingStatusBadge } from '../../components/ui/Badge';
import { SectionLoader }      from '../../components/ui/Spinner';
import {
  formatDateTime,
  formatCurrency,
  getErrorMessage,
} from '../../utils/helpers';

const ManagerBookings = () => {
  const [lots,         setLots]         = useState([]);
  const [selectedLot,  setSelectedLot]  = useState('');
  const [bookings,     setBookings]     = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [alert,        setAlert]        = useState(null);

  // Load manager's lots
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await parkingLotApi.getMyLots();
        const myLots = res.data || [];
        setLots(myLots);
        if (myLots.length > 0) {
          setSelectedLot(myLots[0].id);
        }
      } catch (err) {
        setAlert({ type: 'error', message: getErrorMessage(err) });
      }
    };
    load();
  }, []);

  // Load bookings for selected lot
  useEffect(() => {
    if (!selectedLot) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await bookingApi.getBookingsByLot(selectedLot);
        const bks = res.data || [];
        setBookings(bks);
        setFiltered(bks);
      } catch (err) {
        setAlert({ type: 'error', message: getErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedLot]);

  // Apply status filter
  useEffect(() => {
    setFiltered(
      statusFilter === 'ALL'
        ? bookings
        : bookings.filter(b => b.status === statusFilter)
    );
  }, [statusFilter, bookings]);

  const columns = [
    {
      key:   'id',
      label: 'Booking ID',
      render: (v) => <span className="font-mono text-sm">#{v}</span>,
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
        <span className="capitalize text-xs">
          {v?.replace('_', ' ')?.toLowerCase()}
        </span>
      ),
    },
    {
      key:   'startTime',
      label: 'Start',
      render: (v) => formatDateTime(v),
    },
    {
      key:   'endTime',
      label: 'End',
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

  const summary = {
    total:     bookings.length,
    active:    bookings.filter(b => b.status === 'ACTIVE').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
    revenue:   bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((s, b) => s + (b.totalFare || 0), 0),
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Lot Bookings
        </h1>
        <p className="text-slate-500 mt-1">
          View all bookings for your parking lots
        </p>
      </div>

      {alert && (
        <Alert
          variant={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Lot selector + filter */}
      <div className="card flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <Select
            label="Select Lot"
            value={selectedLot}
            onChange={(e) => setSelectedLot(e.target.value)}
          >
            {lots.map(l => (
              <option key={l.id} value={l.id}>
                {l.name} — {l.city}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-1">
          {['ALL', 'RESERVED', 'ACTIVE',
            'COMPLETED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium
                transition-colors whitespace-nowrap
                ${statusFilter === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) +
               s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total',     value: summary.total,     color: 'slate'   },
            { label: 'Active',    value: summary.active,    color: 'emerald' },
            { label: 'Completed', value: summary.completed, color: 'blue'    },
            { label: 'Cancelled', value: summary.cancelled, color: 'red'     },
            {
              label: 'Revenue',
              value: formatCurrency(summary.revenue),
              color: 'amber',
            },
          ].map(({ label, value, color }) => {
            const textColors = {
              slate: 'text-slate-900', emerald: 'text-emerald-700',
              blue: 'text-blue-700', red: 'text-red-700',
              amber: 'text-amber-700',
            };
            const bgColors = {
              slate: 'bg-slate-50', emerald: 'bg-emerald-50',
              blue: 'bg-blue-50', red: 'bg-red-50', amber: 'bg-amber-50',
            };
            return (
              <div key={label}
                   className={`${bgColors[color]} rounded-xl p-3
                                text-center`}>
                <p className={`font-bold text-lg ${textColors[color]}`}>
                  {value}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMsg="No bookings found for this lot"
      />
    </div>
  );
};

export default ManagerBookings;