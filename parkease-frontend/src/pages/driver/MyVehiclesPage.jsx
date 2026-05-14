import React, { useState, useEffect } from 'react';
import {
  Car, Plus, Edit2, Trash2, Zap,
  AlertCircle,
} from 'lucide-react';
import vehicleApi from '../../api/vehicleApi';
import Button       from '../../components/ui/Button';
import Modal        from '../../components/ui/Modal';
import Input, { Select } from '../../components/ui/Input';
import Alert        from '../../components/ui/Alert';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState   from '../../components/ui/EmptyState';
import { SectionLoader } from '../../components/ui/Spinner';
import {
  VEHICLE_TYPES,
} from '../../utils/constants';
import { getErrorMessage } from '../../utils/helpers';

const INITIAL_FORM = {
  licensePlate: '',
  make:         '',
  model:        '',
  color:        '',
  year:         '',
  vehicleType:  'FOUR_WHEELER',
  isEV:         false,
};

const MyVehiclesPage = () => {
  const [vehicles,   setVehicles]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget,setDeleteTarget]=useState(null);
  const [form,       setForm]       = useState(INITIAL_FORM);
  const [errors,     setErrors]     = useState({});
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [alert,      setAlert]      = useState(null);

  // ── Load vehicles ─────────────────────────────────────────────
  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehicleApi.getMyVehicles();
      setVehicles(res.data || []);
    } catch (err) {
      setAlert({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVehicles(); }, []);

  // ── Open create modal ─────────────────────────────────────────
  const openCreate = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setEditTarget(null);
    setModalOpen(true);
  };

  // ── Open edit modal ───────────────────────────────────────────
  const openEdit = (vehicle) => {
    setForm({
      licensePlate: vehicle.licensePlate,
      make:         vehicle.make,
      model:        vehicle.model,
      color:        vehicle.color        || '',
      year:         vehicle.year         || '',
      vehicleType:  vehicle.vehicleType,
      isEV:         vehicle.isEV,
    });
    setErrors({});
    setEditTarget(vehicle);
    setModalOpen(true);
  };

  // ── Validate ──────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.licensePlate.trim())
      e.licensePlate = 'License plate is required';
    else if (!/^[A-Z0-9 -]{2,20}$/i.test(form.licensePlate))
      e.licensePlate = 'Enter a valid license plate';
    if (!form.make.trim())
      e.make  = 'Make is required';
    if (!form.model.trim())
      e.model = 'Model is required';
    if (!form.vehicleType)
      e.vehicleType = 'Vehicle type is required';
    if (form.year && (form.year < 1900 || form.year > 2100))
      e.year = 'Enter a valid year';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save (create or update) ───────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        licensePlate: form.licensePlate.toUpperCase().trim(),
        year: form.year ? parseInt(form.year) : undefined,
      };

      if (editTarget) {
        await vehicleApi.updateVehicle(editTarget.id, payload);
        setAlert({ type: 'success', message: 'Vehicle updated!' });
      } else {
        await vehicleApi.registerVehicle(payload);
        setAlert({ type: 'success', message: 'Vehicle registered!' });
      }

      setModalOpen(false);
      loadVehicles();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete vehicle ────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vehicleApi.deleteVehicle(deleteTarget.id);
      setAlert({ type: 'success', message: 'Vehicle removed.' });
      setDeleteTarget(null);
      loadVehicles();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setDeleting(false);
    }
  };

  // ── Mark EV ───────────────────────────────────────────────────
  const handleMarkEV = async (vehicle) => {
    try {
      await vehicleApi.markAsEV(vehicle.id);
      setAlert({
        type: 'success',
        message: `${vehicle.licensePlate} marked as EV.`
      });
      loadVehicles();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Vehicles
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your registered vehicles
          </p>
        </div>
        <Button
          onClick={openCreate}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Vehicle
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

      {/* ── Content ──────────────────────────────────────────── */}
      {loading ? (
        <SectionLoader message="Loading vehicles..." />
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={<Car className="w-8 h-8" />}
          title="No vehicles registered"
          message="Add your first vehicle to start booking parking spots."
          action={openCreate}
          actionLabel="Add Vehicle"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={() => openEdit(vehicle)}
              onDelete={() => setDeleteTarget(vehicle)}
              onMarkEV={() => handleMarkEV(vehicle)}
            />
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Vehicle' : 'Add New Vehicle'}
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
            <Button
              onClick={handleSave}
              loading={saving}
            >
              {editTarget ? 'Save Changes' : 'Register Vehicle'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="License Plate"
            placeholder="MH12AB1234"
            value={form.licensePlate}
            onChange={(e) => setForm(p => ({
              ...p,
              licensePlate: e.target.value.toUpperCase()
            }))}
            error={errors.licensePlate}
            disabled={!!editTarget}
            hint="Auto-converted to uppercase"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Make"
              placeholder="Honda"
              value={form.make}
              onChange={(e) => setForm(p => ({
                ...p, make: e.target.value
              }))}
              error={errors.make}
              required
            />
            <Input
              label="Model"
              placeholder="City"
              value={form.model}
              onChange={(e) => setForm(p => ({
                ...p, model: e.target.value
              }))}
              error={errors.model}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Color"
              placeholder="White"
              value={form.color}
              onChange={(e) => setForm(p => ({
                ...p, color: e.target.value
              }))}
            />
            <Input
              label="Year"
              type="number"
              placeholder="2022"
              value={form.year}
              onChange={(e) => setForm(p => ({
                ...p, year: e.target.value
              }))}
              error={errors.year}
            />
          </div>

          <Select
            label="Vehicle Type"
            value={form.vehicleType}
            onChange={(e) => setForm(p => ({
              ...p, vehicleType: e.target.value
            }))}
            error={errors.vehicleType}
            required
          >
            {VEHICLE_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>

          {/* EV toggle */}
          <label className="flex items-center gap-3 cursor-pointer
                             p-3 rounded-xl border border-slate-200
                             hover:bg-slate-50 transition-colors">
            <div
              className={`
                w-10 h-6 rounded-full transition-colors relative
                ${form.isEV ? 'bg-emerald-500' : 'bg-slate-200'}
              `}
              onClick={() => setForm(p => ({
                ...p, isEV: !p.isEV
              }))}
            >
              <div className={`
                w-4 h-4 bg-white rounded-full shadow absolute
                top-1 transition-transform
                ${form.isEV ? 'translate-x-5' : 'translate-x-1'}
              `} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 flex
                            items-center gap-1">
                <Zap className="w-4 h-4 text-emerald-500" />
                Electric Vehicle (EV)
              </p>
              <p className="text-xs text-slate-500">
                Enables EV charging spot booking
              </p>
            </div>
          </label>
        </div>
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Vehicle?"
        message={`Remove "${deleteTarget?.licensePlate}" from your account? This cannot be undone.`}
        confirmLabel="Remove"
      />
    </div>
  );
};

// ── Vehicle Card ───────────────────────────────────────────────
const VehicleCard = ({ vehicle, onEdit, onDelete, onMarkEV }) => (
  <div className="card hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-blue-50 rounded-xl
                        flex items-center justify-center">
          <Car className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-bold text-slate-900 text-sm">
            {vehicle.licensePlate}
          </p>
          <p className="text-xs text-slate-500 capitalize">
            {vehicle.vehicleType?.replace('_', ' ')?.toLowerCase()}
          </p>
        </div>
      </div>
      {vehicle.isEV && (
        <span className="flex items-center gap-1 px-2 py-0.5
                         bg-emerald-50 text-emerald-700 text-[10px]
                         font-semibold rounded-full">
          <Zap className="w-2.5 h-2.5" />EV
        </span>
      )}
    </div>

    <div className="space-y-1 mb-4 text-sm text-slate-600">
      <p>
        <span className="text-slate-400">Make: </span>
        {vehicle.make} {vehicle.model}
      </p>
      {vehicle.color && (
        <p>
          <span className="text-slate-400">Color: </span>
          {vehicle.color}
        </p>
      )}
      {vehicle.year && (
        <p>
          <span className="text-slate-400">Year: </span>
          {vehicle.year}
        </p>
      )}
    </div>

    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={onEdit}
        icon={<Edit2 className="w-3.5 h-3.5" />}
        className="flex-1"
      >
        Edit
      </Button>
      {!vehicle.isEV && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onMarkEV}
          icon={<Zap className="w-3.5 h-3.5" />}
          className="flex-1"
        >
          Mark EV
        </Button>
      )}
      <Button
        variant="danger"
        size="sm"
        onClick={onDelete}
        icon={<Trash2 className="w-3.5 h-3.5" />}
      />
    </div>
  </div>
);

export default MyVehiclesPage;