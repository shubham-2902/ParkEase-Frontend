import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie,
  Cell, Legend,
} from 'recharts';
import {
  BarChart3, TrendingUp, Clock, RefreshCw,
} from 'lucide-react';
import analyticsApi  from '../../api/analyticsApi';
import paymentApi    from '../../api/paymentApi';
import parkingLotApi from '../../api/parkingLotApi';
import { Select }    from '../../components/ui/Input';
import Button        from '../../components/ui/Button';
import StatCard      from '../../components/ui/StatCard';
import Alert         from '../../components/ui/Alert';
import { SectionLoader } from '../../components/ui/Spinner';
import {
  formatCurrency,
  getErrorMessage,
} from '../../utils/helpers';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4',
];

const ManagerAnalytics = () => {
  const location      = useLocation();
  const preSelectedId = location.state?.lotId;

  const [lots,          setLots]          = useState([]);
  const [selectedLotId, setSelectedLotId] = useState(
    preSelectedId || ''
  );
  const [occupancy,     setOccupancy]     = useState(null);
  const [peakHours,     setPeakHours]     = useState([]);
  const [hourlyData,    setHourlyData]    = useState([]);
  const [revenueData,   setRevenueData]   = useState(null);
  const [spotTypes,     setSpotTypes]     = useState([]);
  const [dailyRevenue,  setDailyRevenue]  = useState([]);
  const [avgDuration,   setAvgDuration]   = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [alert,         setAlert]         = useState(null);

  // Date range (last 30 days)
  const [dateRange] = useState(() => {
    const to   = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return {
      from: from.toISOString(),
      to:   to.toISOString(),
    };
  });

  // Load lots
  useEffect(() => {
    const loadLots = async () => {
      try {
        const res  = await parkingLotApi.getMyLots();
        const myLots = (res.data || []).filter(
          l => l.status === 'APPROVED'
        );
        setLots(myLots);
        if (!selectedLotId && myLots.length > 0) {
          setSelectedLotId(myLots[0].id);
        }
      } catch {}
    };
    loadLots();
  }, []);

  // Load analytics for selected lot
  const loadAnalytics = async () => {
    if (!selectedLotId) return;
    setLoading(true);
    setAlert(null);

    const results = await Promise.allSettled([
      analyticsApi.getOccupancyRate(selectedLotId),
      analyticsApi.getPeakHours(selectedLotId),
      analyticsApi.getHourlyBreakdown(selectedLotId),
      analyticsApi.getRevenue(
        selectedLotId, dateRange.from, dateRange.to
      ),
      analyticsApi.getSpotTypeUtilisation(selectedLotId),
      analyticsApi.getAvgDuration(selectedLotId),
      paymentApi.getDailyRevenue(
        selectedLotId, dateRange.from, dateRange.to
      ),
    ]);

    const [
      occupancyRes, peakRes, hourlyRes,
      revenueRes, spotTypeRes, durationRes, dailyRevRes,
    ] = results;

    if (occupancyRes.status === 'fulfilled')
      setOccupancy(occupancyRes.value.data);
    if (peakRes.status === 'fulfilled')
      setPeakHours(peakRes.value.data || []);
    if (hourlyRes.status === 'fulfilled')
      setHourlyData(hourlyRes.value.data || []);
    if (revenueRes.status === 'fulfilled')
      setRevenueData(revenueRes.value.data);
    if (spotTypeRes.status === 'fulfilled')
      setSpotTypes(spotTypeRes.value.data || []);
    if (durationRes.status === 'fulfilled')
      setAvgDuration(durationRes.value.data?.avgDurationMinutes);
    if (dailyRevRes.status === 'fulfilled')
      setDailyRevenue(dailyRevRes.value.data || []);

    setLoading(false);
  };

  useEffect(() => { loadAnalytics(); }, [selectedLotId]);

  // ── Chart data formatters ──────────────────────────────────────

  // Hourly occupancy for bar chart
  const hourlyChartData = hourlyData.map(h => ({
    hour:  h.hourLabel?.split(' ')[0] || `${h.hour}:00`,
    rate:  h.avgOccupancyRate,
    label: h.category,
  }));

  // Daily revenue for line chart
  const dailyChartData = dailyRevenue.map(d => ({
    date:    d.date?.slice(5) || '',
    revenue: parseFloat(d.dailyRevenue || 0),
  }));

  // Spot type for pie chart
  const pieData = spotTypes.map(s => ({
    name:  s.spotType,
    value: s.totalBookings,
  }));

  const occupancyColor =
    occupancy?.occupancyRate >= 90 ? '#ef4444' :
    occupancy?.occupancyRate >= 70 ? '#f59e0b' :
    occupancy?.occupancyRate >= 40 ? '#3b82f6' :
    '#10b981';

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Analytics
          </h1>
          <p className="text-slate-500 mt-1">
            Occupancy, revenue and usage insights
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

      {/* ── Lot selector ──────────────────────────────────────── */}
      <div className="card">
        <Select
          label="Select Lot"
          value={selectedLotId}
          onChange={(e) => setSelectedLotId(e.target.value)}
        >
          <option value="">Choose a lot...</option>
          {lots.map(l => (
            <option key={l.id} value={l.id}>
              {l.name} — {l.city}
            </option>
          ))}
        </Select>
      </div>

      {loading && (
        <SectionLoader message="Loading analytics..." />
      )}

      {!loading && selectedLotId && (
        <>
          {/* ── KPI Cards ──────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Occupancy rate with dial */}
            <div className="card col-span-2 sm:col-span-1">
              <p className="text-sm font-medium text-slate-500 mb-2">
                Current Occupancy
              </p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold"
                   style={{ color: occupancyColor }}>
                  {occupancy?.occupancyRate ?? 0}%
                </p>
                <div className="mb-1">
                  <p className="text-xs font-medium"
                     style={{ color: occupancyColor }}>
                    {occupancy?.status ?? 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {occupancy?.occupiedSpots ?? 0}/
                    {occupancy?.totalSpots ?? 0} spots
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${occupancy?.occupancyRate ?? 0}%`,
                    backgroundColor: occupancyColor,
                  }}
                />
              </div>
            </div>

            <StatCard
              title="Total Revenue (30d)"
              value={formatCurrency(revenueData?.totalRevenue ?? 0)}
              icon={TrendingUp}
              color="blue"
            />
            <StatCard
              title="Total Bookings (30d)"
              value={revenueData?.totalBookings ?? 0}
              icon={BarChart3}
              color="emerald"
            />
            <StatCard
              title="Avg. Duration"
              value={avgDuration
                ? `${Math.round(avgDuration)} min`
                : '—'
              }
              icon={Clock}
              color="amber"
            />
          </div>

          {/* ── Hourly Occupancy Bar Chart ─────────────────── */}
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4">
              Hourly Occupancy Pattern
            </h2>
            {hourlyChartData.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Not enough data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourlyChartData}
                          margin={{ top: 5, right: 10,
                                    left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3"
                                 stroke="#f1f5f9" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Occupancy']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="rate"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Daily Revenue Line Chart ──────────────────── */}
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4">
              Daily Revenue (Last 30 Days)
            </h2>
            {dailyChartData.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No revenue data in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyChartData}
                           margin={{ top: 5, right: 10,
                                     left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3"
                                 stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v), 'Revenue']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Bottom row: Peak Hours + Spot Types ──────── */}
          <div className="grid sm:grid-cols-2 gap-4">

            {/* Peak hours */}
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4">
                Peak Hours
              </h2>
              {peakHours.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">
                  Not enough data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {peakHours.map((ph, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-500
                                       w-20 flex-shrink-0">
                        {ph.hourLabel?.split(' ')[0]}
                      </span>
                      <div className="flex-1 h-5 bg-slate-100
                                      rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full
                                     transition-all text-[10px]
                                     text-white font-medium
                                     flex items-center px-2"
                          style={{
                            width: `${ph.avgOccupancyRate}%`,
                            backgroundColor:
                              ph.avgOccupancyRate >= 80
                                ? '#ef4444'
                                : ph.avgOccupancyRate >= 60
                                ? '#f59e0b'
                                : '#3b82f6',
                          }}
                        >
                          {ph.avgOccupancyRate > 20
                            ? `${ph.avgOccupancyRate}%`
                            : ''}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 w-6
                                       flex-shrink-0 text-right">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spot type utilisation pie */}
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4">
                Spot Type Utilisation
              </h2>
              {pieData.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">
                  No booking data yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [v, n]}
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
          </div>
        </>
      )}
    </div>
  );
};

export default ManagerAnalytics;