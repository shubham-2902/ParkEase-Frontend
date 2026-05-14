import React, { useState, useEffect } from 'react';
import { History, Download, Filter } from 'lucide-react';
import bookingApi from '../../api/bookingApi';
import paymentApi from '../../api/paymentApi';
import Table      from '../../components/ui/Table';
import Button     from '../../components/ui/Button';
import Alert      from '../../components/ui/Alert';
import { BookingStatusBadge } from '../../components/ui/Badge';
import {
  formatDateTime,
  formatCurrency,
  getErrorMessage,
} from '../../utils/helpers';
import { generateReceipt } from '../../utils/pdfGenerator';

const BookingHistoryPage = () => {
  const [bookings,  setBookings]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [alert,     setAlert]     = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await bookingApi.getMyHistory();
        setBookings(res.data || []);
        setFiltered(res.data || []);
      } catch (err) {
        setAlert({ type: 'error', message: getErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter by status
  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFiltered(bookings);
    } else {
      setFiltered(bookings.filter(b => b.status === statusFilter));
    }
  }, [statusFilter, bookings]);

  const handleDownloadReceipt = async (booking) => {
    try {
      const res = await paymentApi.getPaymentByBookingId(booking.id);
      const receiptRes = await paymentApi.generateReceipt(
        res.data.id
      );
      generateReceipt(receiptRes.data);
    } catch {
      setAlert({
        type: 'warning',
        message: 'No payment receipt available for this booking.',
      });
    }
  };

  const columns = [
    {
      key:   'id',
      label: '#',
      render: (val) => (
        <span className="font-mono text-sm">#{val}</span>
      ),
    },
    {
      key:   'startTime',
      label: 'Date',
      render: (val) => formatDateTime(val),
    },
    {
      key:   'spotId',
      label: 'Spot',
      render: (val, row) => (
        <div>
          <p className="text-sm font-medium">Spot {val}</p>
          <p className="text-xs text-slate-400">
            Lot {row.lotId}
          </p>
        </div>
      ),
    },
    {
      key:   'vehiclePlate',
      label: 'Vehicle',
    },
    {
      key:   'totalFare',
      label: 'Fare',
      render: (val) => val ? formatCurrency(val) : '—',
    },
    {
      key:   'status',
      label: 'Status',
      render: (val) => <BookingStatusBadge status={val} />,
    },
    {
      key:   'id',
      label: 'Receipt',
      render: (_, row) => row.status === 'COMPLETED' ? (
        <Button
          variant="ghost"
          size="sm"
          icon={<Download className="w-3.5 h-3.5" />}
          onClick={() => handleDownloadReceipt(row)}
        >
          PDF
        </Button>
      ) : '—',
    },
  ];

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Booking History
          </h1>
          <p className="text-slate-500 mt-1">
            All past and completed bookings
          </p>
        </div>
      </div>

      {alert && (
        <Alert
          variant={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Filter bar */}
      <div className="card flex items-center gap-2 flex-wrap py-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-600 font-medium">
          Filter:
        </span>
        {['ALL', 'COMPLETED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`
              px-3 py-1 rounded-full text-xs font-medium
              transition-colors
              ${statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            {status === 'ALL' ? 'All' : status.charAt(0) +
             status.slice(1).toLowerCase()}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">
          {filtered.length} records
        </span>
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMsg="No booking history found"
      />
    </div>
  );
};

export default BookingHistoryPage;