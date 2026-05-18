import React, { useState, useEffect } from 'react';
import { CreditCard, RefreshCw, TrendingUp } from 'lucide-react';
import paymentApi from '../../api/paymentApi';
import Table      from '../../components/ui/Table';
import Button     from '../../components/ui/Button';
import Alert      from '../../components/ui/Alert';
import StatCard   from '../../components/ui/StatCard';
import { PaymentStatusBadge } from '../../components/ui/Badge';
import {
  formatCurrency,
  formatDateTime,
  getErrorMessage,
} from '../../utils/helpers';

const AdminPayments = () => {
  const [payments,  setPayments]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [revenue,   setRevenue]   = useState(null);
  const [statusFilter,setStatusFilter]=useState('ALL');
  const [alert,     setAlert]     = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, revenueRes] = await Promise.allSettled([
        paymentApi.getAllPayments(),
        paymentApi.getPlatformRevenue(),
      ]);

      if (paymentsRes.status === 'fulfilled') {
        const pms = paymentsRes.value.data || [];
        setPayments(pms);
        setFiltered(pms);
      }
      if (revenueRes.status === 'fulfilled') {
        setRevenue(revenueRes.value.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    setFiltered(
      statusFilter === 'ALL'
        ? payments
        : payments.filter(p => p.status === statusFilter)
    );
  }, [statusFilter, payments]);

  const paidCount    = payments.filter(p => p.status === 'PAID').length;
  const failedCount  = payments.filter(p => p.status === 'FAILED').length;

  const columns = [
    {
      key:   'id',
      label: 'Payment ID',
      render: (v) => (
        <span className="font-mono text-sm">#{v}</span>
      ),
    },
    {
      key:   'bookingId',
      label: 'Booking ID',
      render: (v) => `#${v}`,
    },
    {
      key:   'userId',
      label: 'User',
      render: (v) => `User #${v}`,
    },
    {
      key:   'amount',
      label: 'Amount',
      render: (v) => (
        <span className="font-semibold text-slate-900">
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      key:   'mode',
      label: 'Mode',
      render: (v) => (
        <span className="capitalize text-xs">
          {v?.toLowerCase() || '—'}
        </span>
      ),
    },
    {
      key:   'status',
      label: 'Status',
      render: (v) => <PaymentStatusBadge status={v} />,
    },
    {
      key:   'razorpayPaymentId',
      label: 'Razorpay ID',
      render: (v) => v ? (
        <span className="font-mono text-xs text-slate-400
                         max-w-[100px] block truncate">
          {v}
        </span>
      ) : '—',
    },
    {
      key:   'paidAt',
      label: 'Paid At',
      render: (v) => v ? formatDateTime(v) : '—',
    },
  ];

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            All Payments
          </h1>
          <p className="text-slate-500 mt-1">
            Platform-wide payment transactions
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={loadData}
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(revenue?.totalRevenue ?? 0)}
          icon={TrendingUp}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Paid Transactions"
          value={paidCount}
          icon={CreditCard}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Failed"
          value={failedCount}
          icon={CreditCard}
          color="red"
          loading={loading}
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PAID', 'PENDING', 'FAILED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
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
        emptyMsg="No payment records found"
      />
    </div>
  );
};

export default AdminPayments;