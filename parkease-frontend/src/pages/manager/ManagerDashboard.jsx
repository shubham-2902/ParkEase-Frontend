
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, TrendingUp, Users,
  BarChart3, RefreshCw, ArrowRight, Layers,
  CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';
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

const ManagerDashboard = () => {
  const navigate = useNavigate();

  const [lots,           setLots]           = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [stats,          setStats]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [alert,          setAlert]          = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const lotsRes = await parkingLotApi.getMyLots();
      const myLots  = lotsRes.data || [];
      setLots(myLots);

      // Load bookings + revenue for each lot
      let totalRevenue    = 0;
      let totalBookings   = 0;
      let activeBookings  = 0;
      let allBookings     = [];

      await Promise.allSettled(
        myLots.map(async (lot) => {
          try {
            const [bookRes, revRes] = await Promise.allSettled([
              bookingApi.getBookingsByLot(lot.id),
              paymentApi.getLotRevenue(lot.id),
            ]);

            if (bookRes.status === 'fulfilled') {
              const bks = bookRes.value.data || [];
              totalBookings  += bks.length;
              activeBookings += bks.filter(
                b => b.status === 'ACTIVE'
              ).length;
              allBookings = [...allBookings, ...bks];
            }

            if (revRes.status === 'fulfilled') {
              totalRevenue += revRes.value.data?.revenue || 0;
            }
          } catch {}
        })
      );

      // Sort all bookings newest first
      allBookings.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setRecentBookings(allBookings.slice(0, 6));
      setStats({
        totalLots:     myLots.length,
        approvedLots:  myLots.filter(
          l => l.status === 'APPROVED'
        ).length,
        totalBookings,
        activeBookings,
        totalRevenue,
        totalSpots: myLots.reduce(
          (s, l) => s + (l.totalSpots || 0), 0
        ),
        availableSpots: myLots.reduce(
          (s, l) => s + (l.availableSpots || 0), 0
        ),
      });

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
          <h1 className="text-2xl font-bold text-slate-900">
            Manager Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of your parking lots
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={loadDashboard}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Layers className="w-4 h-4" />}
            onClick={() => navigate('/manager/spots')}
          >
            Manage Spots
          </Button>
          <Button
            size="sm"
            icon={<Building2 className="w-4 h-4" />}
            onClick={() => navigate('/manager/lots')}
          >
            Manage Lots
          </Button>
        </div>
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
          title="My Lots"
          value={stats?.totalLots ?? '—'}
          icon={Building2}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          icon={TrendingUp}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings ?? '—'}
          icon={Users}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Active Now"
          value={stats?.activeBookings ?? '—'}
          icon={CheckCircle2}
          color="amber"
          loading={loading}
        />
      </div>

      {/* ── Availability overview ─────────────────────────────── */}
      {stats && (
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">
            Spot Availability
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900">
                {stats.totalSpots}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Spots</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-700">
                {stats.availableSpots}
              </p>
              <p className="text-xs text-slate-500 mt-1">Available</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-700">
                {stats.totalSpots - stats.availableSpots}
              </p>
              <p className="text-xs text-slate-500 mt-1">Occupied</p>
            </div>
          </div>
          {stats.totalSpots > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs
                              text-slate-500 mb-1">
                <span>Occupancy</span>
                <span>
                  {Math.round(
                    (stats.totalSpots - stats.availableSpots)
                    / stats.totalSpots * 100
                  )}%
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full
                              overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full
                             transition-all"
                  style={{
                    width: `${Math.round(
                      (stats.totalSpots - stats.availableSpots)
                      / stats.totalSpots * 100
                    )}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Lots list ─────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">
            My Parking Lots
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/manager/lots')}
          >
            Manage all
          </Button>
        </div>

        {loading ? (
          <SectionLoader message="Loading lots..." />
        ) : lots.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-10 h-10 text-slate-300
                                   mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-3">
              You haven't registered any parking lots yet.
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/manager/lots')}
            >
              Register First Lot
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {lots.map((lot) => (
              <LotRow
                key={lot.id}
                lot={lot}
                onAnalytics={() =>
                  navigate('/manager/analytics', {
                    state: { lotId: lot.id }
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Recent bookings ───────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">
            Recent Bookings
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/manager/bookings')}
          >
            View all
          </Button>
        </div>

        {loading ? (
          <SectionLoader message="Loading bookings..." />
        ) : recentBookings.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">
            No recent bookings
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentBookings.map((booking) => (
              <div key={booking.id}
                   className="py-3 flex items-center
                              justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Booking #{booking.id}
                  </p>
                  <p className="text-xs text-slate-500 flex
                                items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(booking.startTime)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {booking.totalFare && (
                    <span className="text-sm font-semibold
                                     text-slate-900">
                      {formatCurrency(booking.totalFare)}
                    </span>
                  )}
                  <BookingStatusBadge status={booking.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Lot Row ────────────────────────────────────────────────────
const LotRow = ({ lot, onAnalytics }) => {
  const occupancy = lot.totalSpots > 0
    ? Math.round(
        (lot.totalSpots - lot.availableSpots)
        / lot.totalSpots * 100
      )
    : 0;

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl
                    bg-slate-50 hover:bg-slate-100
                    transition-colors">
      <div className="w-10 h-10 bg-emerald-50 rounded-xl
                      flex items-center justify-center flex-shrink-0">
        <Building2 className="w-5 h-5 text-emerald-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm truncate">
          {lot.name}
        </p>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {lot.city}
        </p>
      </div>

      <div className="hidden sm:block text-center">
        <p className="text-xs text-slate-500">Available</p>
        <p className="text-sm font-semibold text-emerald-600">
          {lot.availableSpots}/{lot.totalSpots}
        </p>
      </div>

      <LotStatusBadge status={lot.status} />

      <Button
        variant="ghost"
        size="sm"
        icon={<Layers className="w-3.5 h-3.5" />}
        onClick={() => navigate('/manager/spots', { state: { lotId: lot.id } })}
      >
        <span className="hidden sm:inline">Spots</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        icon={<BarChart3 className="w-3.5 h-3.5" />}
        onClick={onAnalytics}
      >
        <span className="hidden sm:inline">Analytics</span>
      </Button>
    </div>
  );
};

export default ManagerDashboard;