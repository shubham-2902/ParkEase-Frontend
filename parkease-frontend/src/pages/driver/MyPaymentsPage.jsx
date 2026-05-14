import React, { useState, useEffect } from 'react';
import { CreditCard, Download, RefreshCw } from 'lucide-react';
import paymentApi from '../../api/paymentApi';
import Table      from '../../components/ui/Table';
import Button     from '../../components/ui/Button';
import Alert      from '../../components/ui/Alert';
import StatCard   from '../../components/ui/StatCard';
import { PaymentStatusBadge } from '../../components/ui/Badge';
import {
  formatDateTime,
  formatCurrency,
  getErrorMessage,
} from '../../utils/helpers';
import { generateReceipt } from '../../utils/pdfGenerator';

const MyPaymentsPage = () => {
  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [alert,     setAlert]     = useState(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getMyPayments();
      setPayments(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPayments(); }, []);

  const totalSpent = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);


  const handleDownload = async (payment) => {
    try {
      if (payment.status !== 'PAID') {
        setAlert({
          type: 'warning',
          message: 'Receipt only available for PAID payments.',
        });
        return;
      }
      const res = await paymentApi.generateReceipt(payment.id);
      generateReceipt(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    }
  };

  const columns = [
    {
      key:   'id',
      label: 'Payment ID',
      render: (val) => (
        <span className="font-mono text-sm">#{val}</span>
      ),
    },
    {
      key:   'bookingId',
      label: 'Booking',
      render: (val) => `#${val}`,
    },
    {
      key:   'amount',
      label: 'Amount',
      render: (val) => (
        <span className="font-semibold text-slate-900">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key:   'mode',
      label: 'Mode',
      render: (val) => (
        <span className="capitalize text-sm">
          {val?.toLowerCase() || '—'}
        </span>
      ),
    },
    {
      key:   'status',
      label: 'Status',
      render: (val) => <PaymentStatusBadge status={val} />,
    },
    {
      key:   'paidAt',
      label: 'Date',
      render: (val) => val ? formatDateTime(val) : '—',
    },
    {
      key:   'razorpayPaymentId',
      label: 'Txn ID',
      render: (val) => val ? (
        <span className="font-mono text-xs text-slate-500 truncate
                         max-w-[120px] block">
          {val}
        </span>
      ) : '—',
    },
    {
      key:   'id',
      label: 'Receipt',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<Download className="w-3.5 h-3.5" />}
          onClick={() => handleDownload(row)}
          disabled={row.status !== 'PAID'}
        >
          PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Payment History
          </h1>
          <p className="text-slate-500 mt-1">
            All your transactions
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadPayments}
          icon={<RefreshCw className="w-4 h-4" />}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Payments"
          value={payments.length}
          icon={CreditCard}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={CreditCard}
          color="amber"
          loading={loading}
        />
      </div>

      <Table
        columns={columns}
        data={payments}
        loading={loading}
        emptyMsg="No payment records found"
      />
    </div>
  );
};

export default MyPaymentsPage;