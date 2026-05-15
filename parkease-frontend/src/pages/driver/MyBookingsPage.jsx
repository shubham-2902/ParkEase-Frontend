import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Plus, MapPin, Clock,
  LogIn, LogOut, XCircle, Timer,
  ChevronRight, Info,
} from 'lucide-react';
import bookingApi from '../../api/bookingApi';
import vehicleApi from '../../api/vehicleApi';
import parkingLotApi from '../../api/parkingLotApi';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input, { Select } from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { BookingStatusBadge } from '../../components/ui/Badge';
import { SectionLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  formatDateTime,
  formatCurrency,
  getErrorMessage,
  toDatetimeLocal,
  estimateFare,
} from '../../utils/helpers';

const MyBookingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Pre-filled from LotDetailPage
  const preSelected = location.state;

  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [extendTarget, setExtendTarget] = useState(null);
  const [extendLot, setExtendLot] = useState(null);
  const [newEndTime, setNewEndTime] = useState('');

  const [form, setForm] = useState({
    vehicleId: '',
    lotId: preSelected?.lot?.id || '',
    spotId: preSelected?.selectedSpot?.id || '',
    bookingType: preSelected?.timeWindow?.bookingType || 'PRE_BOOKING',
    startTime: preSelected?.timeWindow?.startTime || '',
    endTime: preSelected?.timeWindow?.endTime || '',
    notes: '',
  });

  // ── Load data ─────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, vehiclesRes] = await Promise.allSettled([
        bookingApi.getMyBookings(),
        vehicleApi.getMyVehicles(),
      ]);

      if (bookingsRes.status === 'fulfilled') {
        const all = bookingsRes.value.data || [];
        // Show RESERVED and ACTIVE only on this page
        setBookings(all.filter(
          b => b.status === 'RESERVED' || b.status === 'ACTIVE'
        ));
      }
      if (vehiclesRes.status === 'fulfilled') {
        setVehicles(vehiclesRes.value.data || []);
      }
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-open modal if navigated from spot selection
    if (preSelected?.selectedSpot) {
      setModalOpen(true);
      // For walk-in, set start time to now
      if (form.bookingType === 'WALK_IN') {
        setForm(p => ({ ...p, startTime: toDatetimeLocal(new Date()) }));
      }
    }
  }, []);

  // Update start time when booking type changes to WALK_IN
  useEffect(() => {
    if (form.bookingType === 'WALK_IN') {
      setForm(p => ({ ...p, startTime: toDatetimeLocal(new Date()) }));
    }
  }, [form.bookingType]);

  // ── Validate ──────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.vehicleId) e.vehicleId = 'Select a vehicle';
    if (!form.lotId) e.lotId = 'Lot ID is required';
    if (!form.spotId) e.spotId = 'Spot ID is required';
    if (!form.startTime) e.startTime = 'Start time is required';
    if (!form.endTime) e.endTime = 'End time is required';
    if (form.startTime && form.endTime) {
      const start = new Date(form.startTime);
      const end = new Date(form.endTime);
      if (end <= start) {
        e.endTime = 'End time must be after start time';
      } else {
        const diffHrs = (end - start) / 3600000;
        if (diffHrs < 1)
          e.endTime = 'Minimum booking duration is 1 hour';
      }

      // ── Smart Operating Hours Validation ───────────────────────
      if (preSelected?.lot?.openTime && preSelected?.lot?.closeTime) {
        const lotOpen = preSelected.lot.openTime.substring(0, 5); // HH:mm
        const lotClose = preSelected.lot.closeTime.substring(0, 5);

        const bookingStart = form.startTime.split('T')[1].substring(0, 5);
        const bookingEnd = form.endTime.split('T')[1].substring(0, 5);

        if (bookingStart < lotOpen || bookingStart > lotClose) {
          e.startTime = `Arrival must be within lot hours: ${lotOpen} - ${lotClose}`;
        }
        if (bookingEnd < lotOpen || bookingEnd > lotClose) {
          e.endTime = `Departure must be within lot hours: ${lotOpen} - ${lotClose}`;
        }
      }
    }

    // ── Vehicle Compatibility Check ────────────────────────────
    if (form.vehicleId && preSelected?.selectedSpot) {
      const vehicle = vehicles.find(v => v.id === parseInt(form.vehicleId));
      if (vehicle && vehicle.vehicleType !== preSelected.selectedSpot.vehicleType) {
        e.vehicleId = `Incompatible: Your ${vehicle.vehicleType.toLowerCase().replace('_', ' ')} does not match this ${preSelected.selectedSpot.vehicleType.toLowerCase().replace('_', ' ')} spot.`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Create booking ────────────────────────────────────────────
  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await bookingApi.createBooking({
        vehicleId: parseInt(form.vehicleId),
        lotId: parseInt(form.lotId),
        spotId: parseInt(form.spotId),
        bookingType: form.bookingType,
        startTime: form.startTime + ':00',
        endTime: form.endTime + ':00',
        notes: form.notes,
      });
      setAlert({ type: 'success', message: 'Booking created!' });
      setModalOpen(false);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  // ── Check in ──────────────────────────────────────────────────
  const handleCheckIn = async (booking) => {
    try {
      await bookingApi.checkIn(booking.id);
      setAlert({ type: 'success', message: 'Checked in successfully!' });
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    }
  };

  // ── Extend ────────────────────────────────────────────────────
  const handleExtend = async () => {
    if (!extendTarget || !newEndTime) return;
    setSaving(true);
    try {
      await bookingApi.extendBooking(extendTarget.id, newEndTime + ':00');
      setAlert({ type: 'success', message: 'Booking extended successfully!' });
      setExtendTarget(null);
      setNewEndTime('');
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel ────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await bookingApi.cancelBooking(cancelTarget.id);
      setAlert({ type: 'success', message: 'Booking cancelled.' });
      setCancelTarget(null);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setCancelling(false);
    }
  };

  // Estimated fare preview
  const estimatedFarePreview =
    form.startTime && form.endTime &&
      preSelected?.selectedSpot?.pricePerHour
      ? estimateFare(
        form.startTime,
        form.endTime,
        preSelected.selectedSpot.pricePerHour
      )
      : null;

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Bookings
          </h1>
          <p className="text-slate-500 mt-1">
            Active and upcoming reservations
          </p>
        </div>
        <Button
          onClick={() => navigate('/')}
          icon={<Plus className="w-4 h-4" />}
        >
          New Booking
        </Button>
      </div>

      {/* ── Alert ────────────────────────────────────────────── */}
      {alert && (
        <Alert
          variant={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* ── Bookings list ─────────────────────────────────────── */}
      {loading ? (
        <SectionLoader message="Loading bookings..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-8 h-8" />}
          title="No active bookings"
          message="You have no active or upcoming bookings."
          action={() => navigate('/')}
          actionLabel="Find Parking"
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCheckIn={() => handleCheckIn(booking)}
              onCheckOut={() => navigate(
                `/driver/checkout/${booking.id}`
              )}
              onCancel={() => setCancelTarget(booking)}
              onExtend={async () => {
                setExtendTarget(booking);
                setNewEndTime(toDatetimeLocal(new Date(booking.endTime)));
                try {
                  const res = await parkingLotApi.getLotById(booking.lotId);
                  console.log("Fetched extend lot info:", res.data);
                  setExtendLot(res.data);
                } catch (e) {
                  console.error("Failed to fetch lot info", e);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* ── Create Booking Modal ──────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Booking"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={saving}>
              Confirm Booking
            </Button>
          </>
        }
      >
        <div className="space-y-4">

          {/* Pre-selected spot info */}
          {preSelected?.selectedSpot && (
            <div className="p-3 bg-blue-50 rounded-xl border
                            border-blue-100 text-sm">
              <p className="font-semibold text-blue-900">
                Spot {preSelected.selectedSpot.spotNumber}
              </p>
              <p className="text-blue-700">
                {preSelected.lot?.name} ·
                ₹{preSelected.selectedSpot.pricePerHour}/hr
              </p>
            </div>
          )}

          {/* Booking Summary (Instead of inputs if pre-selected) */}
          {preSelected?.timeWindow && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
               <div>
                  <p className="text-slate-500 uppercase font-bold text-[9px]">Type</p>
                  <p className="text-slate-900 font-medium">
                    {form.bookingType === 'WALK_IN' ? 'Walk-In' : 'Pre-Booking'}
                  </p>
               </div>
               <div>
                  <p className="text-slate-500 uppercase font-bold text-[9px]">Duration</p>
                  <p className="text-slate-900 font-medium">
                    {formatDateTime(form.startTime)} - {' '}
                    {new Date(form.startTime).toDateString() === new Date(form.endTime).toDateString()
                      ? formatDateTime(form.endTime).split(',')[1] // Just time if same day
                      : formatDateTime(form.endTime)               // Full date if different day
                    }
                  </p>
               </div>
            </div>
          )}

          {/* Vehicle */}
          <Select
            label="Select Vehicle"
            value={form.vehicleId}
            onChange={(e) => setForm(p => ({
              ...p, vehicleId: e.target.value
            }))}
            error={errors.vehicleId}
            required
          >
            <option value="">Choose a vehicle...</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.licensePlate} — {v.make} {v.model}
              </option>
            ))}
          </Select>

          {/* Hide redundant fields if pre-selected */}
          {!preSelected?.timeWindow && (
            <>
              {/* Lot ID (editable if not pre-selected) */}
              {!preSelected?.lot && (
                <Input
                  label="Lot ID"
                  type="number"
                  placeholder="Enter lot ID"
                  value={form.lotId}
                  onChange={(e) => setForm(p => ({
                    ...p, lotId: e.target.value
                  }))}
                  error={errors.lotId}
                  required
                />
              )}

              {/* Spot ID */}
              {!preSelected?.selectedSpot && (
                <Input
                  label="Spot ID"
                  type="number"
                  placeholder="Enter spot ID"
                  value={form.spotId}
                  onChange={(e) => setForm(p => ({
                    ...p, spotId: e.target.value
                  }))}
                  error={errors.spotId}
                  required
                />
              )}

              {/* Booking type */}
              <Select
                label="Booking Type"
                value={form.bookingType}
                onChange={(e) => setForm(p => ({
                  ...p, bookingType: e.target.value
                }))}
              >
                <option value="PRE_BOOKING">
                  Pre-Booking (Advance reservation)
                </option>
                <option value="WALK_IN">
                  Walk-In (Immediate)
                </option>
              </Select>

              {/* Time window */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Time"
                  type="datetime-local"
                  value={form.startTime}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setForm(p => ({
                    ...p, startTime: e.target.value
                  }))}
                  error={errors.startTime}
                  disabled={form.bookingType === 'WALK_IN'}
                  hint={form.bookingType === 'WALK_IN' ? 'Starts immediately' : undefined}
                  required
                />
                <Input
                  label="End Time"
                  type="datetime-local"
                  value={form.endTime}
                  min={form.startTime || new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setForm(p => ({
                    ...p, endTime: e.target.value
                  }))}
                  error={errors.endTime}
                  required
                />
              </div>
            </>
          )}

          {/* Fare estimate */}
          {estimatedFarePreview && (
            <div className="p-3 bg-emerald-50 rounded-xl border
                            border-emerald-100 flex justify-between">
              <span className="text-sm text-emerald-700">
                Estimated fare
              </span>
              <span className="text-sm font-bold text-emerald-800">
                {formatCurrency(estimatedFarePreview)}
              </span>
            </div>
          )}

          <Input
            label="Notes (optional)"
            placeholder="Any special instructions..."
            value={form.notes}
            onChange={(e) => setForm(p => ({
              ...p, notes: e.target.value
            }))}
          />
        </div>
      </Modal>

      {/* ── Extend Booking Modal ────────────────────────────────── */}
      <Modal
        isOpen={!!extendTarget}
        onClose={() => {
          setExtendTarget(null);
          setExtendLot(null);
        }}
        title="Extend Booking"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setExtendTarget(null);
                setExtendLot(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExtend} 
              loading={saving}
              disabled={(() => {
                if (!extendLot || !newEndTime) return false;
                const lotOpen = extendLot.openTime?.substring(0, 5);
                const lotClose = extendLot.closeTime?.substring(0, 5);
                const requestedEnd = newEndTime.split('T')[1]?.substring(0, 5);
                
                // Block if before opening OR after closing
                return (lotOpen && requestedEnd < lotOpen) || (lotClose && requestedEnd > lotClose);
              })()}
            >
              Confirm Extension
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm">
            <p className="font-semibold text-blue-900">
              Current End Time: {extendTarget && formatDateTime(extendTarget.endTime)}
            </p>
          </div>
          <Input
            label="New End Time"
            type="datetime-local"
            value={newEndTime}
            min={extendTarget ? toDatetimeLocal(new Date(extendTarget.endTime)) : ''}
            onChange={(e) => setNewEndTime(e.target.value)}
            required
          />

          {/* Operating Hours Warning */}
          {extendLot && newEndTime && (
            (() => {
              const lotOpen = extendLot.openTime?.substring(0, 5);
              const lotClose = extendLot.closeTime?.substring(0, 5);
              const requestedEnd = newEndTime.split('T')[1]?.substring(0, 5);
              
              if (lotOpen && lotClose && requestedEnd) {
                if (requestedEnd < lotOpen || requestedEnd > lotClose) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                       <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" />
                          Warning: The lot is only open from {lotOpen} to {lotClose}. Your selection is outside operating hours.
                       </p>
                    </div>
                  );
                }
              }
              return null;
            })()
          )}

          {/* Additional Fare Preview */}
          {extendTarget && newEndTime && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between">
              <span className="text-sm text-emerald-700 font-medium">
                Additional fare
              </span>
              <span className="text-sm font-bold text-emerald-800">
                {formatCurrency(estimateFare(
                  toDatetimeLocal(new Date(extendTarget.endTime)),
                  newEndTime,
                  extendTarget.pricePerHour
                ))}
              </span>
            </div>
          )}

          <Alert
            variant="info"
            message="Extensions are subject to availability. If another user has booked this spot after you, the extension will be declined."
          />
        </div>
      </Modal>

      {/* ── Cancel Confirm ────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={cancelling}
        title="Cancel Booking?"
        message={`Cancel booking #${cancelTarget?.id}? This booking is non-refundable.`}
        confirmLabel="Cancel Booking"
      />
    </div>
  );
};

// ── Booking Card ───────────────────────────────────────────────
const BookingCard = ({
  booking, onCheckIn, onCheckOut, onCancel, onExtend
}) => {
  const isActive = booking.status === 'ACTIVE';
  const isReserved = booking.status === 'RESERVED';

  return (
    <div className="card border border-slate-100
                    hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row
                      sm:items-start gap-4">

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-slate-900">
              Booking #{booking.id}
            </h3>
            <BookingStatusBadge status={booking.status} />
          </div>

          <div className="space-y-1 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Spot {booking.spotId} · Lot {booking.lotId}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatDateTime(booking.startTime)} –{' '}
              {formatDateTime(booking.endTime)}
            </div>
            {booking.vehiclePlate && (
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                {booking.vehiclePlate} · {booking.bookingType}
              </div>
            )}
            {isActive && booking.checkInTime && (
              <div className="flex items-center gap-1.5
                              text-emerald-600 font-medium">
                <div className="w-2 h-2 bg-emerald-500 rounded-full
                                animate-pulse" />
                Checked in: {formatDateTime(booking.checkInTime)}
              </div>
            )}
          </div>

          {booking.estimatedFare && (
            <p className="text-sm font-semibold text-blue-600 mt-2">
              Est. fare: {formatCurrency(booking.estimatedFare)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-2 flex-shrink-0">
          {isReserved && (
            <Button
              size="sm"
              variant="success"
              onClick={onCheckIn}
              icon={<LogIn className="w-3.5 h-3.5" />}
            >
              Check In
            </Button>
          )}
          {isActive && (
            <Button
              size="sm"
              onClick={onCheckOut}
              icon={<LogOut className="w-3.5 h-3.5" />}
            >
              Check Out
            </Button>
          )}
          {(isReserved || isActive) && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={onExtend}
                icon={<Timer className="w-3.5 h-3.5" />}
              >
                Extend
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={onCancel}
                icon={<XCircle className="w-3.5 h-3.5" />}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;