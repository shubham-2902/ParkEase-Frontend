import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, ToggleLeft,
  ToggleRight, MapPin, Building2, Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import parkingLotApi from '../../api/parkingLotApi';
import Button        from '../../components/ui/Button';
import Modal         from '../../components/ui/Modal';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Alert         from '../../components/ui/Alert';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { LotStatusBadge } from '../../components/ui/Badge';
import { SectionLoader }  from '../../components/ui/Spinner';
import EmptyState         from '../../components/ui/EmptyState';
import { getErrorMessage } from '../../utils/helpers';

const INITIAL_FORM = {
  name:         '',
  address:      '',
  city:         '',
  state:        '',
  pincode:      '',
  latitude:     '',
  longitude:    '',
  totalSpots:   '',
  pricePerHour: '',
  openTime:     '08:00',
  closeTime:    '22:00',
  description:  '',
  imageUrl:     '',
};

const LotManagement = () => {
  const navigate = useNavigate();

  const [lots,        setLots]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [form,        setForm]        = useState(INITIAL_FORM);
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [alert,       setAlert]       = useState(null);

  const loadLots = async () => {
    setLoading(true);
    try {
      const res = await parkingLotApi.getMyLots();
      setLots(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLots(); }, []);

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (lot) => {
    setForm({
      name:         lot.name         || '',
      address:      lot.address      || '',
      city:         lot.city         || '',
      state:        lot.state        || '',
      pincode:      lot.pincode      || '',
      latitude:     lot.latitude     || '',
      longitude:    lot.longitude    || '',
      totalSpots:   lot.totalSpots   || '',
      pricePerHour: lot.pricePerHour || '',
      openTime:     lot.openTime     || '08:00',
      closeTime:    lot.closeTime    || '22:00',
      description:  lot.description  || '',
      imageUrl:     lot.imageUrl     || '',
    });
    setErrors({});
    setEditTarget(lot);
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())
      e.name = 'Lot name is required';
    if (!form.address.trim())
      e.address = 'Address is required';
    if (!form.city.trim())
      e.city = 'City is required';
    if (!form.state.trim())
      e.state = 'State is required';
    if (!form.pincode.trim())
      e.pincode = 'PIN Code is required';
    else if (!/^[1-9][0-9]{5}$/.test(form.pincode))
      e.pincode = 'Enter valid 6-digit PIN code';

    if (!form.latitude || isNaN(parseFloat(form.latitude)))
      e.latitude  = 'Valid Latitude is required';
    if (!form.longitude || isNaN(parseFloat(form.longitude)))
      e.longitude = 'Valid Longitude is required';

    if (!form.totalSpots || form.totalSpots <= 0)
      e.totalSpots = 'Enter valid total spots';
    if (!form.pricePerHour || form.pricePerHour <= 0)
      e.pricePerHour = 'Enter valid price per hour';
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        totalSpots:   parseInt(form.totalSpots),
        pricePerHour: parseFloat(form.pricePerHour),
        latitude:     parseFloat(form.latitude),
        longitude:    parseFloat(form.longitude),
        pincode:      form.pincode,
        // Ensure time format is HH:mm:ss. Only add :00 if missing.
        openTime:     form.openTime && form.openTime.split(':').length === 2 
                        ? `${form.openTime}:00` 
                        : form.openTime || undefined,
        closeTime:    form.closeTime && form.closeTime.split(':').length === 2 
                        ? `${form.closeTime}:00` 
                        : form.closeTime || undefined,
      };

      if (editTarget) {
        await parkingLotApi.updateLot(editTarget.id, payload);
        setAlert({ type: 'success', message: 'Lot updated!' });
      } else {
        await parkingLotApi.createLot(payload);
        setAlert({
          type: 'success',
          message: 'Lot registered! Awaiting admin approval.',
        });
      }
      setModalOpen(false);
      loadLots();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await parkingLotApi.deleteLot(deleteTarget.id);
      setAlert({ type: 'success', message: 'Lot removed.' });
      setDeleteTarget(null);
      loadLots();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (lot) => {
    try {
      await parkingLotApi.toggleLot(lot.id);
      setAlert({
        type: 'success',
        message: `${lot.name} is now ${lot.isOpen ? 'closed' : 'open'}.`,
      });
      loadLots();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setAlert({ type: 'error', message: 'Geolocation not supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm(p => ({
          ...p,
          latitude:  coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6)
        }));
        setAlert({ type: 'success', message: 'Location detected!' });
      },
      () => {
        setAlert({ type: 'error', message: 'Unable to get location' });
      }
    );
  };

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lot Management
          </h1>
          <p className="text-slate-500 mt-1">
            Register and manage your parking lots
          </p>
        </div>
        <Button
          onClick={openCreate}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Lot
        </Button>
      </div>

      {alert && (
        <Alert
          variant={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* ── Lots list ─────────────────────────────────────────── */}
      {loading ? (
        <SectionLoader message="Loading lots..." />
      ) : lots.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="No parking lots yet"
          message="Register your first parking lot to start accepting bookings."
          action={openCreate}
          actionLabel="Register Lot"
        />
      ) : (
        <div className="space-y-4">
          {lots.map((lot) => (
            <LotCard
              key={lot.id}
              lot={lot}
              onEdit={() => openEdit(lot)}
              onDelete={() => setDeleteTarget(lot)}
              onToggle={() => handleToggle(lot)}
              onSpots={() => navigate('/manager/spots', {
                state: { lotId: lot.id }
              })}
            />
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Parking Lot' : 'Register New Lot'}
        size="xl"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editTarget ? 'Save Changes' : 'Register Lot'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">

          {/* Basic info */}
          <Input
            label="Lot Name"
            placeholder="Central Park Parking"
            value={form.name}
            onChange={(e) => setForm(p => ({
              ...p, name: e.target.value
            }))}
            error={errors.name}
            required
          />

          <Textarea
            label="Description"
            placeholder="Brief description of the parking lot..."
            value={form.description}
            onChange={(e) => setForm(p => ({
              ...p, description: e.target.value
            }))}
            rows={2}
          />

          {/* Location */}
          <Input
            label="Street Address"
            placeholder="123 Main Street"
            value={form.address}
            onChange={(e) => setForm(p => ({
              ...p, address: e.target.value
            }))}
            error={errors.address}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="Mumbai"
              value={form.city}
              onChange={(e) => setForm(p => ({
                ...p, city: e.target.value
              }))}
              error={errors.city}
              required
            />
            <Input
              label="State"
              placeholder="Maharashtra"
              value={form.state}
              onChange={(e) => setForm(p => ({
                ...p, state: e.target.value
              }))}
              error={errors.state}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="PIN Code"
              placeholder="400001"
              value={form.pincode}
              onChange={(e) => setForm(p => ({
                ...p, pincode: e.target.value
              }))}
              error={errors.pincode}
              required
            />
            <div className="space-y-2">
              <Input
                label="Image URL"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => setForm(p => ({
                  ...p, imageUrl: e.target.value
                }))}
              />
              {form.imageUrl && (
                <div className="h-20 w-full rounded-lg border
                                border-slate-200 overflow-hidden bg-slate-50">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Coordinates */}
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">
              GPS Coordinates
            </label>
            <button
              type="button"
              onClick={detectLocation}
              className="text-xs text-blue-600 hover:text-blue-700
                         font-semibold flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              Use My Current Location
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              type="number"
              step="any"
              placeholder="19.0760"
              value={form.latitude}
              onChange={(e) => setForm(p => ({
                ...p, latitude: e.target.value.trim()
              }))}
              error={errors.latitude}
              hint="Format: 19.0760"
              required
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              placeholder="72.8777"
              value={form.longitude}
              onChange={(e) => setForm(p => ({
                ...p, longitude: e.target.value.trim()
              }))}
              error={errors.longitude}
              hint="Format: 72.8777"
              required
            />
          </div>

          {/* Capacity & pricing */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total Spots"
              type="number"
              placeholder="100"
              value={form.totalSpots}
              onChange={(e) => setForm(p => ({
                ...p, totalSpots: e.target.value
              }))}
              error={errors.totalSpots}
              required
            />
            <Input
              label="Price per Hour (₹)"
              type="number"
              step="0.01"
              placeholder="50"
              value={form.pricePerHour}
              onChange={(e) => setForm(p => ({
                ...p, pricePerHour: e.target.value
              }))}
              error={errors.pricePerHour}
              required
            />
          </div>

          {/* Operating hours */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Opening Time"
              type="time"
              value={form.openTime}
              onChange={(e) => setForm(p => ({
                ...p, openTime: e.target.value
              }))}
            />
            <Input
              label="Closing Time"
              type="time"
              value={form.closeTime}
              onChange={(e) => setForm(p => ({
                ...p, closeTime: e.target.value
              }))}
            />
          </div>

          {/* Info note */}
          <div className="p-3 bg-amber-50 rounded-xl border
                          border-amber-100 text-sm text-amber-800">
            ⚠️ New lots require admin approval before they appear
            in search results.
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm ────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Parking Lot?"
        message={`Delete "${deleteTarget?.name}"? All associated spots will also be removed.`}
        confirmLabel="Delete Lot"
      />
    </div>
  );
};

// ── Lot Card ───────────────────────────────────────────────────
const LotCard = ({ lot, onEdit, onDelete, onToggle, onSpots }) => (
  <div className="card hover:shadow-md transition-shadow">
    <div className="flex flex-col sm:flex-row sm:items-start
                    gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h3 className="font-semibold text-slate-900">
            {lot.name}
          </h3>
          <LotStatusBadge status={lot.status} />
          <span className={`text-[10px] font-bold px-2 py-0.5
                            rounded-full
                            ${lot.isOpen
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                            }`}>
            {lot.isOpen ? '● OPEN' : '● CLOSED'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm
                        text-slate-500 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {lot.address}, {lot.city}, {lot.state}
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="font-bold text-slate-900">
              {lot.totalSpots}
            </p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="text-center p-2 bg-emerald-50 rounded-lg">
            <p className="font-bold text-emerald-700">
              {lot.availableSpots}
            </p>
            <p className="text-xs text-slate-500">Available</p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="font-bold text-blue-700">
              ₹{lot.pricePerHour}
            </p>
            <p className="text-xs text-slate-500">Per hour</p>
          </div>
        </div>
      </div>

      <div className="flex sm:flex-col gap-2 flex-shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={onSpots}
          icon={<MapPin className="w-3.5 h-3.5" />}
        >
          Spots
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onEdit}
          icon={<Edit2 className="w-3.5 h-3.5" />}
        >
          Edit
        </Button>
        <Button
          variant={lot.isOpen ? 'warning' : 'success'}
          size="sm"
          onClick={onToggle}
          icon={lot.isOpen
            ? <ToggleRight className="w-3.5 h-3.5" />
            : <ToggleLeft  className="w-3.5 h-3.5" />
          }
        >
          {lot.isOpen ? 'Close' : 'Open'}
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          icon={<Trash2 className="w-3.5 h-3.5" />}
        />
      </div>
    </div>
  </div>
);

export default LotManagement;