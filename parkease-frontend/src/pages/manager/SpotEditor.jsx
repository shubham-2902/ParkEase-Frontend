import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Layers, Edit2, Trash2, Zap,
  Accessibility, MapPin, List, Wrench,
} from 'lucide-react';
import spotApi       from '../../api/spotApi';
import parkingLotApi from '../../api/parkingLotApi';
import Button        from '../../components/ui/Button';
import Modal         from '../../components/ui/Modal';
import Input, { Select } from '../../components/ui/Input';
import Alert         from '../../components/ui/Alert';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { SpotStatusBadge } from '../../components/ui/Badge';
import { SectionLoader }   from '../../components/ui/Spinner';
import EmptyState          from '../../components/ui/EmptyState';
import { getErrorMessage } from '../../utils/helpers';
import { SPOT_TYPES, VEHICLE_TYPES } from '../../utils/constants';

const SINGLE_FORM = {
  spotNumber:   '',
  floor:        '0',
  spotType:     null,
  vehicleType:  'FOUR_WHEELER',
  pricePerHour: '',
  isEVCharging: false,
  isHandicapped:false,
};

const BULK_FORM = {
  prefix:       '',
  startNumber:  '1',
  endNumber:    '1', // Default to 1 to help with capacity=1
  floor:        '0',
  spotType:     null,
  vehicleType:  'FOUR_WHEELER',
  pricePerHour: '',
  isEVCharging: false,
  isHandicapped:false,
};

const SpotEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const preselectedLotId = location.state?.lotId;

  const [lots,         setLots]         = useState([]);
  const [selectedLotId,setSelectedLotId]= useState(
    preselectedLotId || ''
  );
  const [spots,        setSpots]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [modalMode,    setModalMode]    = useState(null); // 'single'|'bulk'|'edit'
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [singleForm,   setSingleForm]   = useState(SINGLE_FORM);
  const [bulkForm,     setBulkForm]     = useState(BULK_FORM);
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [alert,        setAlert]        = useState(null);

  // Load lots
  useEffect(() => {
    const loadLots = async () => {
      try {
        const res = await parkingLotApi.getMyLots();
        const approved = (res.data || []).filter(
          l => l.status === 'APPROVED'
        );
        setLots(approved);
        if (!selectedLotId && approved.length > 0) {
          setSelectedLotId(approved[0].id);
        }
      } catch {}
    };
    loadLots();
  }, []);

  // Load spots and pre-fill price when lot changes
  useEffect(() => {
    if (!selectedLotId) return;
    
    // Find selected lot to get default price
    const lot = lots.find(l => l.id === parseInt(selectedLotId));
    if (lot) {
      setSingleForm(p => ({ ...p, pricePerHour: String(lot.pricePerHour) }));
      setBulkForm(p => ({ ...p, pricePerHour: String(lot.pricePerHour) }));
    }

    const loadSpots = async () => {
      setLoading(true);
      try {
        const res = await spotApi.getSpotsByLot(selectedLotId);
        setSpots(res.data || []);
      } catch (err) {
        setAlert({ type: 'error', message: getErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    };
    loadSpots();
  }, [selectedLotId, lots]);

  const selectedLot = lots.find(
    l => l.id === parseInt(selectedLotId)
  );

  // ── Validation ────────────────────────────────────────────────
  const validateSingle = () => {
    const e = {};
    if (!singleForm.spotNumber.trim()) e.spotNumber = 'Spot number required';
    if (!singleForm.pricePerHour || singleForm.pricePerHour <= 0)
      e.pricePerHour = 'Enter valid price';
    
    // Capacity check
    if (!editTarget && selectedLot && (spots.length + 1) > selectedLot.totalSpots) {
      setAlert({ 
        type: 'error', 
        message: `Cannot exceed lot capacity of ${selectedLot.totalSpots} spots.` 
      });
      return false;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateBulk = () => {
    const e = {};
    if (!bulkForm.prefix.trim()) e.prefix = 'Prefix required';
    if (!bulkForm.pricePerHour || bulkForm.pricePerHour <= 0)
      e.pricePerHour = 'Enter valid price';
    if (parseInt(bulkForm.endNumber) < parseInt(bulkForm.startNumber))
      e.endNumber = 'End must be >= start';
    const count = parseInt(bulkForm.endNumber) - parseInt(bulkForm.startNumber) + 1;
    if (count > 500)
      e.endNumber = 'Max 500 spots per bulk creation';

    // Capacity check
    if (selectedLot && (spots.length + count) > selectedLot.totalSpots) {
      setAlert({ 
        type: 'error', 
        message: `Bulk creation would exceed lot capacity (${selectedLot.totalSpots}). Current: ${spots.length}, Trying to add: ${count}.` 
      });
      return false;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Handlers ──────────────────────────────────────────────────
  const handleSaveSingle = async () => {
    if (!validateSingle()) return;
    setSaving(true);
    try {
      const payload = {
        ...singleForm,
        lotId:        parseInt(selectedLotId),
        floor:        parseInt(singleForm.floor),
        pricePerHour: parseFloat(singleForm.pricePerHour),
      };
      if (editTarget) {
        if (editTarget.status !== 'AVAILABLE' && editTarget.status !== 'MAINTENANCE') {
          setAlert({ 
            type: 'error', 
            message: 'Cannot edit a spot that is currently booked or reserved.' 
          });
          setModalMode(null);
          return;
        }
        await spotApi.updateSpot(editTarget.id, payload);
        setAlert({ type: 'success', message: 'Spot updated!' });
      } else {
        await spotApi.createSpot(payload);
        setAlert({ type: 'success', message: 'Spot created!' });
      }
      setModalMode(null);
      setEditTarget(null);
      const res = await spotApi.getSpotsByLot(selectedLotId);
      setSpots(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBulk = async () => {
    if (!validateBulk()) return;
    setSaving(true);
    try {
      const startNum = parseInt(bulkForm.startNumber);
      const endNum   = parseInt(bulkForm.endNumber);
      const payload = {
        lotId:        parseInt(selectedLotId),
        spotPrefix:   bulkForm.prefix.trim(),
        startNumber:  startNum,
        count:        endNum - startNum + 1,
        floor:        parseInt(bulkForm.floor),
        spotType:     null,
        vehicleType:  bulkForm.vehicleType,
        pricePerHour: parseFloat(bulkForm.pricePerHour),
        isEVCharging: bulkForm.isEVCharging,
        isHandicapped:bulkForm.isHandicapped,
      };
      await spotApi.createBulkSpots(payload);
      setAlert({
        type: 'success',
        message: `${payload.count} spots created successfully!`,
      });
      setModalMode(null);
      const res = await spotApi.getSpotsByLot(selectedLotId);
      setSpots(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.status !== 'AVAILABLE') {
      setAlert({ 
        type: 'error', 
        message: 'Cannot delete a spot that is currently booked or reserved.' 
      });
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    try {
      await spotApi.deleteSpot(deleteTarget.id);
      setAlert({ type: 'success', message: 'Spot deleted.' });
      setDeleteTarget(null);
      const res = await spotApi.getSpotsByLot(selectedLotId);
      setSpots(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (spot) => {
    setSingleForm({
      spotNumber:    spot.spotNumber,
      floor:         String(spot.floor),
      spotType:      null,
      vehicleType:   spot.vehicleType,
      pricePerHour:  String(spot.pricePerHour),
      isEVCharging:  spot.isEVCharging,
      isHandicapped: spot.isHandicapped,
    });
    setEditTarget(spot);
    setModalMode('edit');
    setErrors({});
  };

  const handleToggleMaintenance = async (spot) => {
    try {
      if (spot.status === 'MAINTENANCE') {
        await spotApi.releaseSpot(spot.id);
        setAlert({ type: 'success', message: `Spot ${spot.spotNumber} is now Available.` });
      } else {
        await spotApi.setMaintenance(spot.id);
        setAlert({ type: 'success', message: `Spot ${spot.spotNumber} is now in Maintenance.` });
      }
      const res = await spotApi.getSpotsByLot(selectedLotId);
      setSpots(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    }
  };

  const spotsByFloor = spots.reduce((acc, spot) => {
    const f = spot.floor || 0;
    if (!acc[f]) acc[f] = [];
    acc[f].push(spot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Spot Editor</h1>
          <p className="text-slate-500 mt-1">Add and manage parking spots</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />}
            disabled={!selectedLot}
            onClick={() => { 
              setSingleForm({ ...SINGLE_FORM, pricePerHour: selectedLot?.pricePerHour || '' }); 
              setErrors({}); 
              setEditTarget(null); 
              setModalMode('single'); 
              setAlert(null); 
            }}>
            Add Spot
          </Button>
          <Button size="sm" icon={<Layers className="w-4 h-4" />}
            disabled={!selectedLot}
            onClick={() => { 
              const remaining = selectedLot ? selectedLot.totalSpots - spots.length : 1;
              const defaultEnd = Math.max(1, remaining > 10 ? 10 : remaining);
              setBulkForm({ 
                ...BULK_FORM, 
                pricePerHour: selectedLot?.pricePerHour || '',
                endNumber: String(defaultEnd)
              }); 
              setErrors({}); 
              setModalMode('bulk'); 
              setAlert(null); 
            }}>
            Bulk Create
          </Button>
        </div>
      </div>

      {alert && <Alert variant={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <Select label="Select Lot" value={selectedLotId} onChange={(e) => setSelectedLotId(e.target.value)}>
          <option value="">Choose a lot...</option>
          {lots.map(l => <option key={l.id} value={l.id}>{l.name} — {l.city}</option>)}
        </Select>

        {selectedLot && (
          <div className="flex gap-4 mt-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-slate-900">{spots.length}</p>
              <p className="text-xs text-slate-500">Spots Created</p>
            </div>
            <div className="text-center border-l border-slate-100 pl-4">
              <p className="font-bold text-blue-600">{selectedLot.totalSpots}</p>
              <p className="text-xs text-slate-500">Lot Capacity</p>
            </div>
            <div className="text-center border-l border-slate-100 pl-4">
              <p className="font-bold text-emerald-600">{spots.filter(s => s.status === 'AVAILABLE').length}</p>
              <p className="text-xs text-slate-500">Available</p>
            </div>
          </div>
        )}
      </div>

      {loading ? <SectionLoader message="Loading spots..." /> : !selectedLotId ? (
        <EmptyState icon={<List className="w-8 h-8" />} title="Select a lot" message="Choose a parking lot above to manage spots." />
      ) : spots.length === 0 ? (
        <EmptyState icon={<MapPin className="w-8 h-8" />} title="No spots yet" message="Use Bulk Create to quickly add spots." action={() => setModalMode('bulk')} actionLabel="Bulk Create" />
      ) : (
        Object.entries(spotsByFloor).sort(([a], [b]) => a - b).map(([floor, floorSpots]) => (
          <div key={floor} className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Floor {floor} ({floorSpots.length} spots)</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {[...floorSpots]
                  .sort((a, b) => a.spotNumber.localeCompare(b.spotNumber, undefined, { numeric: true, sensitivity: 'base' }))
                  .map(s => (
                    <SpotTile 
                      key={s.id} 
                      spot={s} 
                      onEdit={() => openEdit(s)} 
                      onDelete={() => setDeleteTarget(s)} 
                      onMaintenance={() => handleToggleMaintenance(s)}
                    />
                  ))
                }
              </div>
          </div>
        ))
      )}

      <Modal isOpen={modalMode === 'single' || modalMode === 'edit'} onClose={() => setModalMode(null)} title={editTarget ? 'Edit Spot' : 'Add Spot'} size="md"
        footer={<><Button variant="secondary" onClick={() => setModalMode(null)}>Cancel</Button><Button onClick={handleSaveSingle} loading={saving}>{editTarget ? 'Save' : 'Create'}</Button></>}>
        
        {alert && (
          <div className="mb-4">
            <Alert variant={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        <SpotForm form={singleForm} setForm={setSingleForm} modalMode={modalMode} errors={errors} bulkForm={bulkForm} setBulkForm={setBulkForm} />
      </Modal>

      <Modal isOpen={modalMode === 'bulk'} onClose={() => setModalMode(null)} title="Bulk Create Spots" size="md"
        footer={<><Button variant="secondary" onClick={() => setModalMode(null)}>Cancel</Button><Button onClick={handleSaveBulk} loading={saving}>Create Spots</Button></>}>
        
        {alert && (
          <div className="mb-4">
            <Alert variant={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        <SpotForm form={bulkForm} setForm={setBulkForm} modalMode="bulk" errors={errors} bulkForm={bulkForm} setBulkForm={setBulkForm} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Spot?" message={`Delete spot "${deleteTarget?.spotNumber}"?`} confirmLabel="Delete" />
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────
const SpotForm = ({ form, setForm, modalMode, errors, bulkForm, setBulkForm }) => (
  <div className="space-y-4">
    {modalMode !== 'bulk' ? (
      <Input label="Spot Number" placeholder="A-01" value={form.spotNumber} onChange={e => setForm(p => ({ ...p, spotNumber: e.target.value.toUpperCase() }))} error={errors.spotNumber} required />
    ) : (
      <>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Prefix" placeholder="A" value={bulkForm.prefix} onChange={e => setBulkForm(p => ({ ...p, prefix: e.target.value.toUpperCase() }))} error={errors.prefix} required />
          <Input label="From #" type="number" value={bulkForm.startNumber} onChange={e => setBulkForm(p => ({ ...p, startNumber: e.target.value }))} />
          <Input label="To #" type="number" value={bulkForm.endNumber} onChange={e => setBulkForm(p => ({ ...p, endNumber: e.target.value }))} error={errors.endNumber} />
        </div>
        <div className="p-2 bg-slate-50 rounded text-xs text-slate-500 italic">
          Preview: {bulkForm.prefix}-{String(bulkForm.startNumber).padStart(2,'0')} → {bulkForm.prefix}-{String(bulkForm.endNumber).padStart(2,'0')}
        </div>
      </>
    )}
    <div className="grid grid-cols-2 gap-3">
      <Select label="Vehicle Type" value={form.vehicleType} onChange={e => setForm(p => ({ ...p, vehicleType: e.target.value }))}>
        {VEHICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </Select>
      <Input label="Price/Hour (₹)" type="number" value={form.pricePerHour} onChange={e => setForm(p => ({ ...p, pricePerHour: e.target.value }))} error={errors.pricePerHour} required />
    </div>
    <Input label="Floor" type="number" value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))} />
    <div className="grid grid-cols-2 gap-3">
      {[
        { key: 'isEVCharging', label: 'EV Charging', icon: <Zap className="w-4 h-4 text-emerald-500" /> },
        { key: 'isHandicapped', label: 'Accessible', icon: <Accessibility className="w-4 h-4 text-blue-500" /> }
      ].map(opt => (
        <label key={opt.key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
          <div className={`w-8 h-5 rounded-full relative transition-colors ${form[opt.key] ? 'bg-emerald-500' : 'bg-slate-200'}`}
               onClick={(e) => { e.preventDefault(); setForm(p => ({ ...p, [opt.key]: !p[opt.key] })); }}>
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${form[opt.key] ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-xs font-medium flex items-center gap-1">{opt.icon} {opt.label}</span>
        </label>
      ))}
    </div>
  </div>
);

const SpotTile = ({ spot, onEdit, onDelete, onMaintenance }) => {
  const colors = { 
    AVAILABLE:   'bg-emerald-50 border-emerald-200', 
    RESERVED:    'bg-amber-50 border-amber-200', 
    OCCUPIED:    'bg-red-50 border-red-200',
    MAINTENANCE: 'bg-slate-100 border-slate-300'
  };
  
  const isAvailable = spot.status === 'AVAILABLE';
  const isMaintenance = spot.status === 'MAINTENANCE';
  const canEditOrDelete = isAvailable || isMaintenance;

  return (
    <div className={`relative p-2 rounded-lg border-2 group transition-all ${colors[spot.status] || 'bg-slate-100'}`}>
      <p className={`text-xs font-bold truncate ${isMaintenance ? 'text-slate-400' : ''}`}>{spot.spotNumber}</p>
      <p className="text-[9px] text-slate-500 capitalize">{spot.vehicleType?.toLowerCase().replace('_', ' ')}</p>
      
      <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-lg">
        {canEditOrDelete && (
          <>
            <button onClick={onEdit} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 className="w-3 h-3" /></button>
            <button onClick={onDelete} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-3 h-3" /></button>
          </>
        )}
        
        {(isAvailable || isMaintenance) && (
          <button 
            onClick={onMaintenance} 
            className={`p-1 rounded transition-colors ${isMaintenance ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-600 hover:bg-slate-100'}`}
            title={isMaintenance ? "End Maintenance" : "Set Maintenance"}
          >
            <Wrench className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SpotEditor;