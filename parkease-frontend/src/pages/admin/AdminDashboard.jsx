import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, BookOpen, CreditCard,
  TrendingUp, CheckCircle2, XCircle,
  Clock, ArrowRight, RefreshCw, ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import authApi       from '../../api/authApi';
import parkingLotApi from '../../api/parkingLotApi';
import bookingApi    from '../../api/bookingApi';
import paymentApi    from '../../api/paymentApi';
import analyticsApi  from '../../api/analyticsApi';
import StatCard      from '../../components/ui/StatCard';
import Button        from '../../components/ui/Button';
import { LotStatusBadge, BookingStatusBadge } from '../../components/ui/Badge';
import { SectionLoader } from '../../components/ui/Spinner';
import Alert             from '../../components/ui/Alert';
import {
  formatCurrency,
  formatDateTime,
  getErrorMessage,
} from '../../utils/helpers';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats,        setStats]        = useState(null);
  const [pendingLots,  setPendingLots]  = useState([]);
  const [recentBooks,  setRecentBooks]  = useState([]);
  const [platformData, setPlatformData] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [alert,        setAlert]        = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        authApi.getAllUsers(),
        parkingLotApi.getAllLots(),
        paymentApi.getPlatformRevenue(),
        analyticsApi.getPlatformSummary(),
      ]);

      const [usersRes, lotsRes, revenueRes, analyticsRes] = results;

      const users  = usersRes.status  === 'fulfilled'
        ? usersRes.value.data   || [] : [];
      const lots   = lotsRes.status   === 'fulfilled'
        ? lotsRes.value.data    || [] : [];
      const revenue = revenueRes.status === 'fulfilled'
        ? revenueRes.value.data : null;
      const analytics = analyticsRes.status === 'fulfilled'
        ? analyticsRes.value.data : null;

      setStats({
        totalUsers:     users.length,
        drivers:        users.filter(u => u.role === 'DRIVER').length,
        managers:       users.filter(u => u.role === 'MANAGER').length,
        totalLots:      lots.length,
        pendingLots:    lots.filter(l => l.status === 'PENDING').length,
        approvedLots:   lots.filter(l => l.status === 'APPROVED').length,
        totalRevenue:   revenue?.totalRevenue ?? 0,
        totalBookings:  analytics?.totalBookings ?? 0,
        activeBookings: analytics?.activeBookings ?? 0,
      });

      setPendingLots(
        lots.filter(l => l.status === 'PENDING').slice(0, 5)
      );
      setPlatformData(analytics);

    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-violet-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-slate-500">
            Platform-wide control and monitoring
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={loadDashboard}
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

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? '—'}
          icon={Users}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Parking Lots"
          value={stats?.totalLots ?? '—'}
          icon={Building2}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title="Platform Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          icon={TrendingUp}
          color="amber"
          loading={loading}
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings ?? '—'}
          icon={BookOpen}
          color="purple"
          loading={loading}
        />
      </div>

      {/* ── Secondary stats ───────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            {
              label: 'Drivers',
              value: stats.drivers,
              bg:    'bg-blue-50',
              text:  'text-blue-700',
            },
            {
              label: 'Managers',
              value: stats.managers,
              bg:    'bg-emerald-50',
              text:  'text-emerald-700',
            },
            {
              label: 'Pending Lots',
              value: stats.pendingLots,
              bg:    'bg-amber-50',
              text:  'text-amber-700',
            },
            {
              label: 'Approved Lots',
              value: stats.approvedLots,
              bg:    'bg-emerald-50',
              text:  'text-emerald-700',
            },
            {
              label: 'Active Now',
              value: stats.activeBookings,
              bg:    'bg-blue-50',
              text:  'text-blue-700',
            },
            {
              label: 'Completed',
              value: platformData?.completedBookings ?? '—',
              bg:    'bg-slate-50',
              text:  'text-slate-700',
            },
          ].map(({ label, value, bg, text }) => (
            <div key={label}
                 className={`${bg} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-bold ${text}`}>
                {value}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Pending approvals ─────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex
                         items-center gap-2">
            {stats?.pendingLots > 0 && (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            Pending Lot Approvals
            {stats?.pendingLots > 0 && (
              <span className="px-2 py-0.5 bg-amber-100
                               text-amber-700 text-xs font-bold
                               rounded-full">
                {stats.pendingLots}
              </span>
            )}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/admin/lots')}
          >
            View all
          </Button>
        </div>

        {loading ? (
          <SectionLoader message="Loading..." />
        ) : pendingLots.length === 0 ? (
          <div className="flex items-center gap-2 py-4
                          text-emerald-600 text-sm">
            <CheckCircle2 className="w-5 h-5" />
            All parking lots have been reviewed.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingLots.map((lot) => (
              <div key={lot.id}
                   className="flex items-center justify-between
                              gap-4 p-3 bg-amber-50 rounded-xl
                              border border-amber-100">
                <div>
                  <p className="font-medium text-slate-900 text-sm">
                    {lot.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lot.city}, {lot.state} ·
                    {lot.totalSpots} spots ·
                    ₹{lot.pricePerHour}/hr
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('/admin/lots')}
                >
                  Review
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon:   Building2,
            title:  'Lot Approvals',
            desc:   'Review pending parking lots',
            color:  'amber',
            badge:  stats?.pendingLots,
            action: () => navigate('/admin/lots'),
          },
          {
            icon:   Users,
            title:  'User Management',
            desc:   'Manage platform users',
            color:  'blue',
            action: () => navigate('/admin/users'),
          },
          {
            icon:   TrendingUp,
            title:  'Analytics',
            desc:   'Platform-wide insights',
            color:  'emerald',
            action: () => navigate('/admin/analytics'),
          },
          {
            icon:   CreditCard,
            title:  'Payments',
            desc:   'All transactions',
            color:  'purple',
            action: () => navigate('/admin/payments'),
          },
        ].map(({ icon: Icon, title, desc, color, badge, action }) => {
          const colors = {
            amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600'  },
            blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600'   },
            emerald:{ bg: 'bg-emerald-50',icon: 'text-emerald-600'},
            purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
          };
          const c = colors[color];
          return (
            <button
              key={title}
              onClick={action}
              className="card text-left hover:shadow-md
                         transition-shadow group relative"
            >
              {badge > 0 && (
                <span className="absolute top-4 right-4
                                 w-5 h-5 bg-red-500 text-white
                                 text-[10px] font-bold rounded-full
                                 flex items-center justify-center">
                  {badge}
                </span>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center
                               justify-center mb-3 ${c.bg}`}>
                <Icon className={`w-5 h-5 ${c.icon}`} />
              </div>
              <p className="font-semibold text-slate-900 text-sm
                            group-hover:text-violet-600
                            transition-colors">
                {title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Top lots ──────────────────────────────────────────── */}
      {platformData?.topLotsByBookings?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">
            Top Lots by Bookings
          </h2>
          <div className="space-y-3">
            {platformData.topLotsByBookings.map((item, idx) => (
              <div key={idx}
                   className="flex items-center justify-between
                              py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-100
                                   text-violet-700 text-xs font-bold
                                   flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-slate-700">
                    Lot #{item.lotId}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {item.totalBookings} bookings
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;