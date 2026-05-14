import React, { useState, useEffect } from 'react';
import {
  Users, Search, UserCheck, UserX,
  Trash2, Shield, Car, Building2,
  RefreshCw, Filter,
} from 'lucide-react';
import authApi  from '../../api/authApi';
import Button   from '../../components/ui/Button';
import Table    from '../../components/ui/Table';
import Alert    from '../../components/ui/Alert';
import Badge    from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { SectionLoader } from '../../components/ui/Spinner';
import {
  formatDateTime,
  getErrorMessage,
} from '../../utils/helpers';

const UserManagement = () => {
  const [users,        setUsers]        = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [alert,        setAlert]        = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [roleFilter,   setRoleFilter]   = useState('ALL');
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType,   setActionType]   = useState(null);
  const [processing,   setProcessing]   = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await authApi.getAllUsers();
      setUsers(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // Apply filters
  useEffect(() => {
    let result = [...users];

    if (roleFilter !== 'ALL') {
      result = result.filter(u => u.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        String(u.id).includes(q)
      );
    }

    setFiltered(result);
  }, [roleFilter, searchQuery, users]);

  const handleAction = async () => {
    if (!actionTarget) return;
    setProcessing(true);
    try {
      if (actionType === 'suspend') {
        await authApi.suspendUser(actionTarget.id);
        setAlert({
          type: 'success',
          message: `${actionTarget.fullName} suspended.`,
        });
      } else if (actionType === 'activate') {
        await authApi.activateUser(actionTarget.id);
        setAlert({
          type: 'success',
          message: `${actionTarget.fullName} activated.`,
        });
      } else if (actionType === 'delete') {
        await authApi.deleteUser(actionTarget.id);
        setAlert({
          type: 'success',
          message: `${actionTarget.fullName} deleted.`,
        });
      }
      setActionTarget(null);
      setActionType(null);
      loadUsers();
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setProcessing(false);
    }
  };

  const roleIcon = (role) => {
    if (role === 'DRIVER')  return <Car className="w-3.5 h-3.5" />;
    if (role === 'MANAGER') return <Building2 className="w-3.5 h-3.5" />;
    if (role === 'ADMIN')   return <Shield className="w-3.5 h-3.5" />;
  };

  const roleVariant = (role) => {
    if (role === 'DRIVER')  return 'blue';
    if (role === 'MANAGER') return 'emerald';
    if (role === 'ADMIN')   return 'purple';
    return 'gray';
  };

  const columns = [
    {
      key:   'id',
      label: 'ID',
      render: (v) => (
        <span className="font-mono text-xs text-slate-500 font-medium">
          {v}
        </span>
      ),
    },
    {
      key:   'fullName',
      label: 'Name',
      render: (v, row) => (
        <div>
          <p className="font-medium text-slate-900 text-sm">{v}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      ),
    },
    {
      key:   'role',
      label: 'Role',
      render: (v) => (
        <Badge variant={roleVariant(v)}>
          <span className="flex items-center gap-1">
            {roleIcon(v)} {v}
          </span>
        </Badge>
      ),
    },
    {
      key:   'phone',
      label: 'Phone',
      render: (v) => v || '—',
    },
    {
      key:   'isActive',
      label: 'Status',
      render: (v) => (
        <Badge variant={v ? 'green' : 'red'} dot>
          {v ? 'Active' : 'Suspended'}
        </Badge>
      ),
    },
    {
      key:   'provider',
      label: 'Auth',
      render: (v) => (
        <span className="text-xs text-slate-500 capitalize">
          {v || 'email'}
        </span>
      ),
    },
    {
      key:   'createdAt',
      label: 'Joined',
      render: (v) => v
        ? new Date(v).toLocaleDateString('en-IN')
        : '—',
    },
    {
      key:   'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          {row.isActive ? (
            row.role !== 'ADMIN' && (
              <Button
                variant="warning"
                size="sm"
                onClick={() => {
                  setActionTarget(row);
                  setActionType('suspend');
                }}
                icon={<UserX className="w-3 h-3" />}
              />
            )
          ) : (
            <Button
              variant="success"
              size="sm"
              onClick={() => {
                setActionTarget(row);
                setActionType('activate');
              }}
              icon={<UserCheck className="w-3 h-3" />}
            />
          )}
          {row.role !== 'ADMIN' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setActionTarget(row);
                setActionType('delete');
              }}
              icon={<Trash2 className="w-3 h-3" />}
            />
          )}
        </div>
      ),
    },
  ];

  const counts = {
    ALL:     users.length,
    DRIVER:  users.filter(u => u.role === 'DRIVER').length,
    MANAGER: users.filter(u => u.role === 'MANAGER').length,
    ADMIN:   users.filter(u => u.role === 'ADMIN').length,
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            User Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage all platform users
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={loadUsers}
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

      {/* Search + filters */}
      <div className="card flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="flex-1 min-w-[200px] flex items-center
                        gap-2 px-3 rounded-lg border border-slate-200
                        bg-white focus-within:ring-2
                        focus-within:ring-violet-500">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 py-2 text-sm text-slate-900
                       placeholder:text-slate-400 outline-none"
          />
        </div>

        {/* Role filter pills */}
        <div className="flex gap-1">
          {['ALL', 'DRIVER', 'MANAGER', 'ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium
                transition-colors
                ${roleFilter === role
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              {role === 'ALL' ? 'All' : role.charAt(0) +
               role.slice(1).toLowerCase()}
              <span className="ml-1 opacity-70">
                ({counts[role]})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Count display */}
      {!loading && (
        <p className="text-sm text-slate-500">
          Showing{' '}
          <span className="font-semibold text-slate-900">
            {filtered.length}
          </span>{' '}
          of {users.length} users
        </p>
      )}

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMsg="No users found"
      />

      {/* Action confirm */}
      <ConfirmDialog
        isOpen={!!actionTarget && !!actionType}
        onClose={() => {
          setActionTarget(null);
          setActionType(null);
        }}
        onConfirm={handleAction}
        loading={processing}
        title={
          actionType === 'suspend' ? 'Suspend User?' :
          actionType === 'activate' ? 'Activate User?' :
          'Delete User?'
        }
        message={
          actionType === 'suspend'
            ? `Suspend ${actionTarget?.fullName}? They will not be able to login.`
            : actionType === 'activate'
            ? `Reactivate ${actionTarget?.fullName}'s account?`
            : `Permanently delete ${actionTarget?.fullName}? This cannot be undone.`
        }
        confirmLabel={
          actionType === 'suspend'  ? 'Suspend'  :
          actionType === 'activate' ? 'Activate' :
          'Delete'
        }
        confirmVariant={
          actionType === 'activate' ? 'success' : 'danger'
        }
      />
    </div>
  );
};

export default UserManagement;