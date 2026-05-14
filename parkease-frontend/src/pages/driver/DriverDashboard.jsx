import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, CalendarDays, CreditCard, MapPin,
  Clock, ArrowRight, Search, CheckCircle2,
  AlertCircle, TrendingUp,
} from 'lucide-react';
import { useAuth }      from '../../context/AuthContext';
import bookingApi       from '../../api/bookingApi';
import vehicleApi       from '../../api/vehicleApi';
import paymentApi       from '../../api/paymentApi';
import StatCard         from '../../components/ui/StatCard';
import Button           from '../../components/ui/Button';
import { BookingStatusBadge } from '../../components/ui/Badge';
import { SectionLoader }      from '../../components/ui/Spinner';
import {
  formatDateTime,
  formatCurrency,
  getErrorMessage,
} from '../../utils/helpers';

const DriverDashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [stats,          setStats]          = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [bookingsRes, vehiclesRes, activeRes] =
          await Promise.allSettled([
            bookingApi.getMyBookings(),
            vehicleApi.getMyVehicles(),
            bookingApi.getMyActiveBookings(),
          ]);

        const bookings  = bookingsRes.status  === 'fulfilled'
          ? bookingsRes.value.data  || [] : [];
        const vehicles  = vehiclesRes.status  === 'fulfilled'
          ? vehiclesRes.value.data  || [] : [];
        const active    = activeRes.status    === 'fulfilled'
          ? activeRes.value.data    || [] : [];

        // Calculate stats
        const completed = bookings.filter(
          b => b.status === 'COMPLETED'
        );
        const totalSpent = completed.reduce(
          (sum, b) => sum + (b.totalFare || 0), 0
        );

        setStats({
          totalBookings:  bookings.length,
          activeBookings: active.length,
          totalVehicles:  vehicles.length,
          totalSpent,
        });

        setActiveBookings(active.slice(0, 3));
        setRecentBookings(bookings.slice(0, 5));

      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting()},{' '}
            {user?.fullName?.split(' ')[0] || 'Driver'} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year:    'numeric',
              month:   'long',
              day:     'numeric',
            })}
          </p>
        </div>
        <Button
          onClick={() => navigate('/')}
          icon={<Search className="w-4 h-4" />}
        >
          Find Parking
        </Button>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings ?? '—'}
          icon={CalendarDays}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Active Now"
          value={stats?.activeBookings ?? '—'}
          icon={CheckCircle2}
          color="green"
          loading={loading}
        />
        <StatCard
          title="My Vehicles"
          value={stats?.totalVehicles ?? '—'}
          icon={Car}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(stats?.totalSpent ?? 0)}
          icon={CreditCard}
          color="amber"
          loading={loading}
        />
      </div>

      {/* ── Active bookings ───────────────────────────────────── */}
      {activeBookings.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex
                           items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full
                              animate-pulse" />
              Active Parking
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/driver/bookings')}
            >
              View all
            </Button>
          </div>

          <div className="space-y-3">
            {activeBookings.map((booking) => (
              <ActiveBookingCard
                key={booking.id}
                booking={booking}
                onCheckout={() => navigate(
                  `/driver/checkout/${booking.id}`
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon:   Search,
            title:  'Find Parking',
            desc:   'Search available spots near you',
            color:  'blue',
            action: () => navigate('/'),
          },
          {
            icon:   Car,
            title:  'My Vehicles',
            desc:   'Manage your registered vehicles',
            color:  'purple',
            action: () => navigate('/driver/vehicles'),
          },
          {
            icon:   CreditCard,
            title:  'Payment History',
            desc:   'View receipts and transactions',
            color:  'emerald',
            action: () => navigate('/driver/payments'),
          },
        ].map(({ icon: Icon, title, desc, color, action }) => {
          const colors = {
            blue:    { bg: 'bg-blue-50',   icon: 'text-blue-600'   },
            purple:  { bg: 'bg-purple-50', icon: 'text-purple-600' },
            emerald: { bg: 'bg-emerald-50',icon: 'text-emerald-600'},
          };
          const c = colors[color];
          return (
            <button
              key={title}
              onClick={action}
              className="card text-left hover:shadow-md
                         transition-shadow group"
            >
              <div className={`w-10 h-10 rounded-xl
                               flex items-center justify-center
                               mb-3 ${c.bg}`}>
                <Icon className={`w-5 h-5 ${c.icon}`} />
              </div>
              <p className="font-semibold text-slate-900 text-sm
                            group-hover:text-blue-600 transition-colors">
                {title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {desc}
              </p>
            </button>
          );
        })}
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
            onClick={() => navigate('/driver/history')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            View history
          </Button>
        </div>

        {loading ? (
          <SectionLoader message="Loading bookings..." />
        ) : recentBookings.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="w-10 h-10 text-slate-300
                                     mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              No bookings yet
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => navigate('/')}
            >
              Book your first spot
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentBookings.map((booking) => (
              <div key={booking.id}
                   className="py-3 flex items-center
                              justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    Booking #{booking.id}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex
                                items-center gap-1">
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

// ── Active Booking Card ────────────────────────────────────────
const ActiveBookingCard = ({ booking, onCheckout }) => (
  <div className="flex items-center justify-between gap-4
                  p-4 bg-emerald-50 rounded-xl border
                  border-emerald-100">
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-slate-900 text-sm">
        Booking #{booking.id}
      </p>
      <p className="text-xs text-slate-600 mt-0.5">
        Spot: {booking.spotId} · {booking.vehiclePlate}
      </p>
      <p className="text-xs text-emerald-600 font-medium mt-1
                    flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full
                        animate-pulse" />
        Checked in · {formatDateTime(booking.checkInTime)}
      </p>
    </div>
    <Button size="sm" onClick={onCheckout}>
      Check out
    </Button>
  </div>
);

export default DriverDashboard;