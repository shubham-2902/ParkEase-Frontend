import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Users, BookOpen, CreditCard,
  RefreshCw, BarChart3,
} from 'lucide-react';
import analyticsApi from '../../api/analyticsApi';
import paymentApi   from '../../api/paymentApi';
import StatCard     from '../../components/ui/StatCard';
import Button       from '../../components/ui/Button';
import Alert        from '../../components/ui/Alert';
import { SectionLoader } from '../../components/ui/Spinner';
import {
  formatCurrency,
  getErrorMessage,
} from '../../utils/helpers';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4',
];

const AdminAnalytics = () => {
  const [platform,   setPlatform]   = useState(null);
  const [occupancy,  setOccupancy]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [alert,      setAlert]      = useState(null);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [platformRes, occupancyRes] = await Promise.allSettled([
        analyticsApi.getPlatformSummary(),
        analyticsApi.getAllOccupancy(),
      ]);

      if (platformRes.status === 'fulfilled') {
        setPlatform(platformRes.value.data);
      }
      if (occupancyRes.status === 'fulfilled') {
        setOccupancy(occupancyRes.value.data || []);
      }
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnalytics(); }, []);

  // Booking breakdown for pie chart
  const bookingPieData = platform ? [
    { name: 'Completed', value: platform.completedBookings || 0 },
    { name: 'Active',    value: platform.activeBookings    || 0 },
    { name: 'Cancelled', value: platform.cancelledBookings || 0 },
  ].filter(d => d.value > 0) : [];

  // Vehicle breakdown for bar chart
  const vehicleData = (platform?.vehicleTypeBreakdown || []).map(v => ({
    type:  v.vehicleType?.replace('_', ' '),
    count: v.count,
  }));

  // Occupancy chart data
  const occupancyChartData = occupancy
    .slice(0, 10)
    .map(o => ({
      lot:  `Lot #${o.lotId}`,
      rate: o.occupancyRate,
    }));

  // Top lots bar chart
  const topLotsData = (platform?.topLotsByBookings || [])
    .slice(0, 8)
    .map(l => ({
      lot:      `#${l.lotId}`,
      bookings: l.totalBookings,
    }));

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Platform Analytics
          </h1>
          <p className="text-slate-500 mt-1">
            Comprehensive platform insights
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={loadAnalytics}
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

      {loading ? (
        <SectionLoader message="Loading analytics..." />
      ) : (
        <>
          {/* ── KPI Cards ──────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Bookings"
              value={platform?.totalBookings ?? 0}
              icon={BookOpen}
              color="blue"
            />
            <StatCard
              title="Active Bookings"
              value={platform?.activeBookings ?? 0}
              icon={Users}
              color="green"
            />
            <StatCard
              title="Platform Revenue"
              value={formatCurrency(platform?.totalRevenue ?? 0)}
              icon={TrendingUp}
              color="amber"
            />
            <StatCard
              title="Avg. Fare"
              value={formatCurrency(platform?.platformAvgFare ?? 0)}
              icon={CreditCard}
              color="purple"
            />
          </div>

          {/* ── Booking status breakdown + Vehicle types ──── */}
          <div className="grid sm:grid-cols-2 gap-4">

            {/* Booking breakdown pie */}
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4">
                Booking Status Breakdown
              </h2>
              {bookingPieData.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm">
                  No data available
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={bookingPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {bookingPieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Vehicle type bar chart */}
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4">
                Vehicle Type Distribution
              </h2>
              {vehicleData.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm">
                  No data available
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={vehicleData}
                    margin={{ top: 5, right: 10,
                              left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3"
                                   stroke="#f1f5f9" />
                    <XAxis
                      dataKey="type"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Top lots bar chart ─────────────────────────── */}
          {topLotsData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4">
                Top Lots by Booking Volume
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={topLotsData}
                  margin={{ top: 5, right: 10,
                            left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3"
                                 stroke="#f1f5f9" />
                  <XAxis
                    dataKey="lot"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    formatter={(v) => [v, 'Bookings']}
                    contentStyle={{
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="bookings"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Lot occupancy chart ─────────────────────────── */}
          {occupancyChartData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4">
                Current Lot Occupancy Rates
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={occupancyChartData}
                  margin={{ top: 5, right: 10,
                            left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3"
                                 stroke="#f1f5f9" />
                  <XAxis
                    dataKey="lot"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Occupancy']}
                    contentStyle={{
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="rate"
                    radius={[4, 4, 0, 0]}
                  >
                    {occupancyChartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.rate >= 90 ? '#ef4444' :
                          entry.rate >= 70 ? '#f59e0b' :
                          '#10b981'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Color legend */}
              <div className="flex gap-4 mt-3 justify-end text-xs">
                {[
                  { color: 'bg-emerald-500', label: 'Low (<70%)'  },
                  { color: 'bg-amber-500',   label: 'High (≥70%)' },
                  { color: 'bg-red-500',     label: 'Full (≥90%)' },
                ].map(({ color, label }) => (
                  <div key={label}
                       className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-sm ${color}`} />
                    <span className="text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Platform summary text ─────────────────────── */}
          <div className="card bg-violet-50 border border-violet-100">
            <h2 className="font-semibold text-violet-900 mb-3
                           flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Platform Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4
                            text-sm">
              {[
                {
                  label: 'Total Bookings',
                  value: platform?.totalBookings ?? 0,
                },
                {
                  label: 'Completion Rate',
                  value: platform?.totalBookings
                    ? `${Math.round(
                        (platform.completedBookings /
                          platform.totalBookings) * 100
                      )}%`
                    : '—',
                },
                {
                  label: 'Cancellation Rate',
                  value: platform?.totalBookings
                    ? `${Math.round(
                        (platform.cancelledBookings /
                          platform.totalBookings) * 100
                      )}%`
                    : '—',
                },
                {
                  label: 'Avg. Fare',
                  value: formatCurrency(
                    platform?.platformAvgFare ?? 0
                  ),
                },
                {
                  label: 'Total Revenue',
                  value: formatCurrency(
                    platform?.totalRevenue ?? 0
                  ),
                },
                {
                  label: 'Active Right Now',
                  value: platform?.activeBookings ?? 0,
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-violet-600 text-xs mb-0.5">
                    {label}
                  </p>
                  <p className="font-bold text-violet-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;