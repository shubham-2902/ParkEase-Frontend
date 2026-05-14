import React, { useState, useEffect } from 'react';
import {
  Building2, CheckCircle2, XCircle,
  AlertTriangle, MapPin, Clock, Eye,
  Filter, RefreshCw,
} from 'lucide-react';
import parkingLotApi from '../../api/parkingLotApi';
import Button        from '../../components/ui/Button';
import Modal         from '../../components/ui/Modal';
import { Textarea }  from '../../components/ui/Input';
import Alert         from '../../components/ui/Alert';
import { LotStatusBadge } from '../../components/ui/Badge';
import { SectionLoader }  from '../../components/ui/Spinner';
import EmptyState         from '../../components/ui/EmptyState';
import ConfirmDialog      from '../../components/ui/ConfirmDialog';
import { getErrorMessage } from '../../utils/helpers';

const LotApprovals = () => {
  const [lots,         setLots]         = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [alert,        setAlert]        = useState(null);
  const [viewLot,      setViewLot]      = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType,   setActionType]   = useState(null);
  const [reason,       setReason]       = useState('');
  const [processing,   setProcessing]   = useState(false);

  const loadLots = async () => {
    setLoading(true);
    try {
      const res  = await parkingLotApi.getAllLots();
      setLots(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLots(); }, []);

  useEffect(() => {
    setFiltered(
      statusFilter === 'ALL'
        ? lots
        : lots.filter(l => l.status === statusFilter)
    );
  }, [statusFilter, lots]);

  const openAction = (lot, type) => {
    setActionTarget(lot);
    setActionType(type);
    setReason('');
  };

  const handleAction = async () => {
    if (!actionTarget) return;
    setProcessing(true);
    try {
      if (actionType === 'approve') {
        await parkingLotApi.approveLot(
          actionTarget.id,
          reason || 'Approved by admin'
        );
        setAlert({
          type: 'success',
          message: `"${actionTarget.name}" approved!`,
        });
      } else if (actionType === 'reject') {
        if (!reason.trim()) {
          setAlert({
            type: 'error',
            message: 'Please provide a reason for rejection.',
          });
          setProcessing(false);
          return;
        }
        await parkingLotApi.rejectLot(actionTarget.id, reason);
        setAlert({
          type: 'success',
          message: `"${actionTarget.name}" rejected.`,
        });
      } else if (actionType === 'suspend') {
        await parkingLotApi.suspendLot(actionTarget.id);
        setAlert({
          type: 'success',
          message: `"${actionTarget.name}" suspended.`,
        });
      }
      setActionTarget(null);
      setActionType(null);
      loadLots();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setProcessing(false);
    }
  };

  const actionConfig = {
    approve: {
      title:   'Approve Parking Lot',
      desc:    'Lot will become publicly searchable immediately.',
      confirm: 'Approve',
      variant: 'success',
      color:   'emerald',
    },
    reject: {
      title:   'Reject Parking Lot',
      desc:    'Manager will be notified. Provide a clear reason.',
      confirm: 'Reject',
      variant: 'danger',
      color:   'red',
    },
    suspend: {
      title:   'Suspend Parking Lot',
      desc:    'Lot will be hidden from search. Active bookings unaffected.',
      confirm: 'Suspend',
      variant: 'warning',
      color:   'amber',
    },
  };

  const counts = {
    ALL:      lots.length,
    PENDING:  lots.filter(l => l.status === 'PENDING').length,
    APPROVED: lots.filter(l => l.status === 'APPROVED').length,
    REJECTED: lots.filter(l => l.status === 'REJECTED').length,
    SUSPENDED:lots.filter(l => l.status === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lot Approvals
          </h1>
          <p className="text-slate-500 mt-1">
            Review and approve parking lot registrations
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={loadLots}
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

      {/* ── Filter tabs ───────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING', 'APPROVED',
          'REJECTED', 'SUSPENDED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium
              transition-colors flex items-center gap-2
              ${statusFilter === status
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }
            `}
          >
            {status === 'PENDING' && (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            {status === 'ALL' ? 'All' : status.charAt(0) +
              status.slice(1).toLowerCase()}
            <span className={`
              text-[10px] font-bold px-1.5 py-0.5 rounded-full
              ${statusFilter === status
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-500'
              }
            `}>
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Lots list ─────────────────────────────────────────── */}
      {loading ? (
        <SectionLoader message="Loading lots..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title={`No ${statusFilter.toLowerCase()} lots`}
          message="All lots in this category have been processed."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((lot) => (
            <LotApprovalCard
              key={lot.id}
              lot={lot}
              onView={() => setViewLot(lot)}
              onApprove={() => openAction(lot, 'approve')}
              onReject={() => openAction(lot, 'reject')}
              onSuspend={() => openAction(lot, 'suspend')}
            />
          ))}
        </div>
      )}

      {/* ── Lot detail modal ──────────────────────────────────── */}
      <Modal
        isOpen={!!viewLot}
        onClose={() => setViewLot(null)}
        title={viewLot?.name || 'Lot Details'}
        size="lg"
      >
        {viewLot && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Lot ID',       value: `#${viewLot.id}` },
                { label: 'Status',       value: <LotStatusBadge status={viewLot.status} /> },
                { label: 'Manager ID',   value: `#${viewLot.managerId}` },
                { label: 'City',         value: viewLot.city },
                { label: 'State',        value: viewLot.state },
                { label: 'PIN Code',     value: viewLot.pincode || '—' },
                { label: 'Total Spots',  value: viewLot.totalSpots },
                { label: 'Price/Hour',   value: `₹${viewLot.pricePerHour}` },
                { label: 'Open Time',    value: viewLot.openTime || '—' },
                { label: 'Close Time',   value: viewLot.closeTime || '—' },
                { label: 'Latitude',     value: viewLot.latitude || '—' },
                { label: 'Longitude',    value: viewLot.longitude || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-slate-400 text-xs mb-0.5">
                    {label}
                  </p>
                  <p className="font-medium text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Address</p>
              <p className="font-medium text-slate-900">
                {viewLot.address}
              </p>
            </div>
            {viewLot.description && (
              <div>
                <p className="text-slate-400 text-xs mb-0.5">
                  Description
                </p>
                <p className="text-slate-700">{viewLot.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Action modal (approve / reject / suspend) ─────────── */}
      <Modal
        isOpen={!!actionTarget && !!actionType}
        onClose={() => { setActionTarget(null); setActionType(null); }}
        title={actionType ? actionConfig[actionType]?.title : ''}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setActionTarget(null);
                setActionType(null);
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType
                ? actionConfig[actionType]?.variant
                : 'primary'
              }
              onClick={handleAction}
              loading={processing}
            >
              {actionType
                ? actionConfig[actionType]?.confirm
                : 'Confirm'
              }
            </Button>
          </>
        }
      >
        {actionType && actionTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {actionConfig[actionType]?.desc}
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-sm">
              <p className="font-semibold text-slate-900">
                {actionTarget.name}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                {actionTarget.city}, {actionTarget.state}
              </p>
            </div>
            <Textarea
              label={
                actionType === 'approve'
                  ? 'Note (optional)'
                  : 'Reason (required)'
              }
              placeholder={
                actionType === 'approve'
                  ? 'Approval note...'
                  : 'Explain why this lot is being rejected...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required={actionType === 'reject'}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── Lot Approval Card ──────────────────────────────────────────
const LotApprovalCard = ({
  lot, onView, onApprove, onReject, onSuspend
}) => (
  <div className="card hover:shadow-md transition-shadow">
    <div className="flex flex-col sm:flex-row sm:items-start
                    gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h3 className="font-semibold text-slate-900">
            {lot.name}
          </h3>
          <LotStatusBadge status={lot.status} />
        </div>

        <div className="flex items-center gap-1 text-sm
                        text-slate-500 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {lot.address}, {lot.city}, {lot.state}
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Spots',    value: lot.totalSpots   },
            { label: 'Price/hr', value: `₹${lot.pricePerHour}` },
            { label: 'Manager',  value: `#${lot.managerId}` },
            { label: 'Status',   value: lot.isOpen ? 'Open' : 'Closed' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-2">
              <p className="font-semibold text-slate-900 text-sm">
                {value}
              </p>
              <p className="text-[10px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex sm:flex-col gap-2 flex-shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={onView}
          icon={<Eye className="w-3.5 h-3.5" />}
        >
          View
        </Button>
        {lot.status === 'PENDING' && (
          <>
            <Button
              variant="success"
              size="sm"
              onClick={onApprove}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onReject}
              icon={<XCircle className="w-3.5 h-3.5" />}
            >
              Reject
            </Button>
          </>
        )}
        {lot.status === 'APPROVED' && (
          <Button
            variant="warning"
            size="sm"
            onClick={onSuspend}
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
          >
            Suspend
          </Button>
        )}
        {lot.status === 'REJECTED' && (
          <Button
            variant="success"
            size="sm"
            onClick={onApprove}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Re-approve
          </Button>
        )}
        {lot.status === 'SUSPENDED' && (
          <Button
            variant="success"
            size="sm"
            onClick={onApprove}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Reinstate
          </Button>
        )}
      </div>
    </div>
  </div>
);

export default LotApprovals;