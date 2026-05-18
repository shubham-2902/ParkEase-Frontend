import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, Car, Zap, Accessibility,
  ChevronLeft, Filter, RefreshCw, Info,
  CheckCircle2, XCircle, Navigation,
} from 'lucide-react';
import parkingLotApi from '../../api/parkingLotApi';
import spotApi from '../../api/spotApi';
import vehicleApi from '../../api/vehicleApi';
import bookingApi from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { SpotStatusBadge } from '../../components/ui/Badge';
import { SectionLoader } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import {
  formatCurrency,
  getErrorMessage,
  isLotCurrentlyOpen,
  toDatetimeLocal,
} from '../../utils/helpers';
import Input, { Select } from '../../components/ui/Input';
import { SPOT_TYPES, VEHICLE_TYPES } from '../../utils/constants';

const LotDetailPage = () => {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [lot, setLot] = useState(null);
  const [spots, setSpots] = useState([]);
  const [filteredSpots, setFilteredSpots] = useState([]);
  const [lotLoading, setLotLoading] = useState(true);
  const [spotsLoading, setSpotsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userVehicles, setUserVehicles] = useState([]);
  const [smartMessage, setSmartMessage] = useState('');
  const [occupiedSpotIds, setOccupiedSpotIds] = useState([]);

  // Time selection for availability
  const [timeWindow, setTimeWindow] = useState({
    startTime: toDatetimeLocal(new Date()),
    endTime: toDatetimeLocal(new Date(Date.now() + 2 * 60 * 60 * 1000)), // +2 hours
    bookingType: 'PRE_BOOKING',
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '', // Default to show all spots
    vehicleType: '',
    isEV: false,
  });

  // Booking modal redirect
  const [selectedSpot, setSelectedSpot] = useState(null);

  const isOpen = isLotCurrentlyOpen(lot);

  // ── Load lot details ──────────────────────────────────────────
  useEffect(() => {
    const loadLot = async () => {
      setLotLoading(true);
      try {
        const res = await parkingLotApi.getLotById(lotId);
        setLot(res.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLotLoading(false);
      }
    };
    loadLot();
  }, [lotId]);

  // ── Load spots & availability ────────────────────────────────
  const loadSpotsAndAvailability = async () => {
    // Validation: Departure must be after Arrival
    if (new Date(timeWindow.endTime) <= new Date(timeWindow.startTime)) {
      setOccupiedSpotIds([]); // Clear occupied spots if dates are invalid
      return;
    }

    setSpotsLoading(true);
    try {
      // Fetch both: physical spots and currently booked spots for this window
      const [spotsRes, occupiedRes] = await Promise.all([
        spotApi.getSpotsByLot(lotId),
        bookingApi.getOccupiedSpots(
          lotId,
          timeWindow.startTime + ':00',
          timeWindow.endTime + ':00'
        )
      ]);

      setSpots(spotsRes.data || []);
      setOccupiedSpotIds(occupiedRes.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSpotsLoading(false);
    }
  };

  useEffect(() => {
    if (lotId && timeWindow.startTime && timeWindow.endTime) {
      loadSpotsAndAvailability();
    }
  }, [lotId, timeWindow]);

  // ── Smart Filter: Fetch user vehicles ────────────────────────
  useEffect(() => {
    if (isLoggedIn) {
      const loadUserVehicles = async () => {
        try {
          const res = await vehicleApi.getMyVehicles();
          const vehicles = res.data || [];
          setUserVehicles(vehicles);
        } catch (err) {
          console.error("Failed to load user vehicles", err);
        }
      };
      loadUserVehicles();
    }
  }, [isLoggedIn]);

  // ── Apply filters ─────────────────────────────────────────────
  const isDurationValid = () => {
    const start = new Date(timeWindow.startTime);
    const end = new Date(timeWindow.endTime);
    const diffHrs = (end - start) / 3600000;
    return diffHrs >= 1;
  };

  useEffect(() => {
    let result = [...spots];

    if (filters.status) {
      result = result.filter(s => s.status === filters.status);
    }
    if (filters.vehicleType) {
      result = result.filter(s => s.vehicleType === filters.vehicleType);
    }
    if (filters.isEV) {
      result = result.filter(s => s.isEVCharging);
    }

    setFilteredSpots(result);
  }, [spots, filters]);

  // ── Handle spot selection ──────────────────────────────────────
  const handleSpotSelect = (spot) => {
    if (!isOpen) {
      setError(`This lot is currently closed. It operates from ${lot.openTime} to ${lot.closeTime}.`);
      return;
    }

    // A spot is blocked ONLY if:
    // 1. It is in MAINTENANCE
    // 2. There is a time-based booking overlap
    // 3. It's physically OCCUPIED and the user wants to park RIGHT NOW
    const isTimeBooked = occupiedSpotIds.includes(spot.id);
    const isNow = new Date(timeWindow.startTime) <= new Date(Date.now() + 5 * 60 * 1000); // within 5 mins
    const isPhysicallyBlocked = (spot.status === 'OCCUPIED' || spot.status === 'RESERVED') && isNow;

    if (spot.status === 'MAINTENANCE' || isTimeBooked || isPhysicallyBlocked) {
      return;
    }

    if (!isLoggedIn) {
      // Redirect to login, come back after
      navigate('/login', {
        state: { from: `/lots/${lotId}` }
      });
      return;
    }

    // Navigate to driver booking flow with the selected time
    navigate('/driver/bookings', {
      state: {
        selectedSpot: spot,
        lot,
        timeWindow: {
          startTime: timeWindow.startTime,
          endTime: timeWindow.endTime,
          bookingType: timeWindow.bookingType
        }
      }
    });
  };

  if (lotLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <SectionLoader message="Loading lot details..." />
      </div>
    );
  }


  if (!lot) return null;

  const availableCount = spots.filter(
    s => s.status === 'AVAILABLE'
  ).length;

  const occupancyPercent = lot.totalSpots > 0
    ? Math.round(
      ((lot.totalSpots - lot.availableSpots)
        / lot.totalSpots) * 100
    )
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
                    py-6 sm:py-10">

      {/* ── Error alert ──────────────────────────────────────── */}
      {error && (
        <div className="mb-6">
          <Alert variant="error" message={error} onClose={() => setError('')} />
        </div>
      )}

      {/* ── Back button ──────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm
                   text-slate-500 hover:text-slate-900
                   transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to results
      </button>

      <div className="grid lg:grid-cols-3 gap-8 items-start">

        {/* ── LEFT: Lot info (Sticky) ────────────────────────── */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">

          {/* Main info card */}
          <div className="card shadow-sm border-slate-200/60">

            {/* Lot image */}
            <div className="h-40 bg-gradient-to-br from-slate-100
                            to-slate-200 rounded-xl mb-4 overflow-hidden">
              {lot.imageUrl ? (
                <img
                  src={lot.imageUrl}
                  alt={lot.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center
                                justify-center">
                  <MapPin className="w-10 h-10 text-slate-300" />
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between mb-3">
              <span className={`
                px-3 py-1 rounded-full text-xs font-semibold
                ${isOpen
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
                }
              `}>
                {isOpen ? '● Open' : '● Closed'}
              </span>
              <span className="text-xl font-bold text-blue-600">
                ₹{lot.pricePerHour}
                <span className="text-sm font-normal text-slate-500">
                  /hr
                </span>
              </span>
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-1">
              {lot.name}
            </h1>

            <div className="flex items-start gap-1.5 text-sm
                            text-slate-500 mb-4">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{lot.address}, {lot.city}, {lot.state}</span>
            </div>

            {lot.description && (
              <p className="text-sm text-slate-500 mb-4
                            leading-relaxed">
                {lot.description}
              </p>
            )}

            {/* Occupancy bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-600 font-medium">
                  Availability
                </span>
                <span className="font-semibold text-slate-900">
                  {lot.availableSpots} / {lot.totalSpots}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full
                              overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${occupancyPercent >= 90 ? 'bg-red-500' :
                      occupancyPercent >= 60 ? 'bg-amber-500' :
                        'bg-emerald-500'
                    }`}
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {occupancyPercent}% occupied
              </p>
            </div>

            {/* Details */}
            <div className="space-y-2.5 text-sm border-t
                            border-slate-100 pt-4">
              {lot.openTime && (
                <div className="flex items-center gap-2
                                text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {lot.openTime} – {lot.closeTime}
                </div>
              )}
              <div className="flex items-center gap-2
                              text-slate-600">
                <Car className="w-4 h-4 text-slate-400" />
                {lot.totalSpots} total spots
              </div>
              {lot.pincode && (
                <div className="flex items-center gap-2
                                text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  PIN: {lot.pincode}
                </div>
              )}
            </div>

            {/* Get directions */}
            {lot.latitude && lot.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lot.latitude},${lot.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center
               gap-2 w-full py-2.5 rounded-lg border
               border-slate-200 text-sm font-medium
               text-slate-600 hover:bg-slate-50
               transition-colors"
              >
                <Navigation className="w-4 h-4 text-blue-500" />
                Get directions
              </a>
            )}

          </div>

          {/* Login prompt for guests */}
          {!isLoggedIn && (
            <div className="card bg-blue-50 border border-blue-100">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0
                                 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Sign in to book
                  </p>
                  <p className="text-xs text-blue-700">
                    Create a free account to reserve spots,
                    check in, and pay online.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => navigate('/login')}
                    >
                      Sign in
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate('/register')}
                    >
                      Register
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Spots ──────────────────────────────────── */}
        <div className="lg:col-span-2">

          {/* ── Time-First Selection Bar ────────────────────── */}
          <div className="card mb-4 border-blue-100 bg-blue-50/20 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Booking Type"
                  value={timeWindow.bookingType}
                  onChange={(e) => setTimeWindow(p => ({ ...p, bookingType: e.target.value }))}
                  size="sm"
                  className="bg-white"
                >
                  <option value="PRE_BOOKING">Pre-Booking</option>
                  <option value="WALK_IN">Walk-In (Now)</option>
                </Select>
                <Input
                  label="Arrival"
                  type="datetime-local"
                  value={timeWindow.startTime}
                  onChange={(e) => setTimeWindow(p => ({ ...p, startTime: e.target.value }))}
                  size="sm"
                  className="bg-white"
                  disabled={timeWindow.bookingType === 'WALK_IN'}
                />
                <Input
                  label="Departure"
                  type="datetime-local"
                  value={timeWindow.endTime}
                  min={timeWindow.startTime}
                  onChange={(e) => setTimeWindow(p => ({ ...p, endTime: e.target.value }))}
                  size="sm"
                  className="bg-white"
                />
              </div>
              <div className="pb-1">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full md:w-auto"
                  onClick={loadSpotsAndAvailability}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${spotsLoading ? 'animate-spin' : ''}`} />}
                >
                  Check
                </Button>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="card mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700 mr-1">
                Filter:
              </span>

              {/* Status filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(p => ({
                  ...p, status: e.target.value
                }))}
                className="text-xs border border-slate-200 rounded-lg
                           px-2.5 py-1.5 text-slate-700 bg-white
                           focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              >
                <option value="">All statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="OCCUPIED">Occupied</option>
              </select>


              {/* Vehicle type filter */}
              <select
                value={filters.vehicleType}
                onChange={(e) => setFilters(p => ({
                  ...p, vehicleType: e.target.value
                }))}
                className="text-xs border border-slate-200 rounded-lg
                           px-2.5 py-1.5 text-slate-700 bg-white
                           focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              >
                <option value="">All vehicles</option>
                {VEHICLE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              {/* EV toggle */}
              <button
                onClick={() => setFilters(p => ({
                  ...p, isEV: !p.isEV
                }))}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5
                  rounded-lg text-xs font-medium border
                  transition-colors
                  ${filters.isEV
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }
                `}
              >
                <Zap className="w-3 h-3" />
                EV Only
              </button>

              {/* Refresh */}
              <button
                onClick={loadSpotsAndAvailability}
                className="ml-auto p-1.5 text-slate-400
                           hover:text-slate-600 transition-colors"
                title="Refresh spots"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Duration Warning */}
          {!isDurationValid() && (
            <div className="mb-4">
              <Alert
                variant="warning"
                message="Minimum booking duration is 1 hour. Please adjust your Arrival or Departure time to proceed."
              />
            </div>
          )}

          {/* Operating Hours Warning */}
          {isDurationValid() && (() => {
            if (lot.openTime && lot.closeTime) {
              const lotOpen = lot.openTime.substring(0, 5);
              const lotClose = lot.closeTime.substring(0, 5);
              const arrival = timeWindow.startTime.split('T')[1]?.substring(0, 5);
              const departure = timeWindow.endTime.split('T')[1]?.substring(0, 5);
              
              if ((arrival && (arrival < lotOpen || arrival > lotClose)) || 
                  (departure && (departure < lotOpen || departure > lotClose))) {
                return (
                  <div className="mb-4">
                    <Alert
                      variant="warning"
                      message={`Warning: The lot is only open from ${lotOpen} to ${lotClose}. Your selected Arrival or Departure is outside operating hours. Bookings will not be permitted.`}
                    />
                  </div>
                );
              }
            }
            return null;
          })()}

          {/* Spots count */}
          {isDurationValid() && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filteredSpots.length}
                </span>
                {' '}spots shown
                {filters.status === 'AVAILABLE' && (
                  <span className="ml-1 text-emerald-600 font-medium">
                    ({availableCount} available)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Spots loading */}
          {isDurationValid() && spotsLoading && (
            <SectionLoader message="Loading parking spots..." />
          )}

          {/* No spots */}
          {isDurationValid() && !spotsLoading && filteredSpots.length === 0 && (
            <div className="card text-center py-12">
              <Car className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                No spots match your filters
              </p>
              <button
                onClick={() => setFilters({
                  status: '', vehicleType: '',
                  isEV: false
                })}
                className="text-blue-600 text-sm mt-2
                           hover:underline font-medium"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Spots grid with independent scroll */}
          {!isOpen && (
            <div className="mb-6">
              <Alert
                variant="warning"
                message={`This lot is currently CLOSED. Booking is only available during operating hours: ${lot.openTime} - ${lot.closeTime}`}
              />
            </div>
          )}

          {!spotsLoading && isDurationValid() && filteredSpots.length > 0 && (
            <div className={`max-h-[600px] overflow-y-auto pr-2 custom-scrollbar ${!isOpen ? 'grayscale-[0.6] opacity-60 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3
                              md:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredSpots.map((spot) => (
                  <SpotTile
                    key={spot.id}
                    spot={spot}
                    isTimeBooked={occupiedSpotIds.includes(spot.id)}
                    timeWindow={timeWindow}
                    onClick={() => handleSpotSelect(spot)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 pt-4
                          border-t border-slate-100 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">
              Legend:
            </span>
            {[
              { color: 'bg-emerald-500', label: 'Available' },
              { color: 'bg-amber-500', label: 'Reserved' },
              { color: 'bg-red-500', label: 'Occupied' },
              { color: 'bg-slate-300', label: 'Maintenance' },
            ].map(({ color, label }) => (
              <div key={label}
                className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${color}`} />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Spot Tile Component ────────────────────────────────────────
const SpotTile = ({ spot, isTimeBooked, timeWindow, onClick }) => {
  // A spot is available if:
  // - It's not in maintenance
  // - It's not booked for the selected time
  // - If the time is "now", it's not physically occupied
  const isNow = new Date(timeWindow.startTime) <= new Date(Date.now() + 5 * 60 * 1000);
  const isPhysicallyBlocked = (spot.status === 'OCCUPIED' || spot.status === 'RESERVED') && isNow;

  const isAvailable = spot.status !== 'MAINTENANCE' && !isTimeBooked && !isPhysicallyBlocked;

  const statusConfig = {
    AVAILABLE: { bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400', dot: 'bg-emerald-500' },
    RESERVED: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    OCCUPIED: { bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
    BOOKED: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' }, // Future reservation conflict
    MAINTENANCE: { bg: 'bg-slate-100 border-slate-200', dot: 'bg-slate-400' },
  };

  // Determine visual status
  let displayStatus = spot.status;

  if (isTimeBooked) {
    displayStatus = 'BOOKED';
  } else if (!isNow && (spot.status === 'OCCUPIED' || spot.status === 'RESERVED')) {
    // If it's for the future and physically occupied now, show it as AVAILABLE
    displayStatus = 'AVAILABLE';
  }

  const config = statusConfig[displayStatus] || statusConfig.MAINTENANCE;

  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      className={`
        relative p-3 rounded-xl border-2 text-left
        transition-all duration-150 group
        ${config.bg}
        ${isAvailable
          ? 'cursor-pointer active:scale-95'
          : 'cursor-not-allowed opacity-70'
        }
      `}
    >
      {/* Status dot */}
      <div className={`
        w-2 h-2 rounded-full mb-2 ${config.dot}
      `} />

      {/* Spot number */}
      <p className="text-sm font-bold text-slate-900 truncate">
        {spot.spotNumber}
      </p>

      {/* Floor */}
      <p className="text-[10px] text-slate-500 mt-0.5">
        Floor {spot.floor}
      </p>

      <p className="text-[10px] text-slate-400 capitalize">
        {spot.vehicleType?.toLowerCase().replace('_', ' ')}
      </p>

      {/* Price */}
      <p className="text-[10px] font-semibold text-blue-600 mt-1">
        ₹{spot.pricePerHour}/hr
      </p>

      {/* EV badge */}
      {spot.isEVCharging && (
        <div className="absolute top-1.5 right-1.5">
          <Zap className="w-3 h-3 text-emerald-600" />
        </div>
      )}

      {/* Handicapped badge */}
      {spot.isHandicapped && (
        <div className="absolute bottom-1.5 right-1.5">
          <Accessibility className="w-3 h-3 text-blue-500" />
        </div>
      )}

      {/* Available overlay */}
      {isAvailable && (
        <div className="absolute inset-0 rounded-xl
                        bg-emerald-500/0 group-hover:bg-emerald-500/5
                        transition-colors" />
      )}
    </button>
  );
};

export default LotDetailPage;