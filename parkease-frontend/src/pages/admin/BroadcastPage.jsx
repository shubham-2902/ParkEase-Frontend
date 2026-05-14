import React, { useState } from 'react';
import {
  Bell, Users, Send, CheckCircle2,
  AlertTriangle, Info,
} from 'lucide-react';
import notificationApi from '../../api/notificationApi';
import authApi         from '../../api/authApi';
import Button          from '../../components/ui/Button';
import Input           from '../../components/ui/Input';
import { Select, Textarea } from '../../components/ui/Input';
import Alert           from '../../components/ui/Alert';
import { SectionLoader } from '../../components/ui/Spinner';

const NOTIFICATION_TYPES = [
  { value: 'PLATFORM_BROADCAST', label: 'Platform Broadcast' },
  { value: 'BOOKING_CONFIRMED',  label: 'Booking Update'     },
  { value: 'PAYMENT_SUCCESS',    label: 'Payment Alert'      },
  { value: 'EXPIRY_REMINDER',    label: 'Expiry Reminder'    },
];

const AUDIENCE_OPTIONS = [
  { value: 'ALL',     label: 'All Users',     icon: Users },
  { value: 'DRIVER',  label: 'All Drivers',   icon: Users },
  { value: 'MANAGER', label: 'All Managers',  icon: Users },
  { value: 'SPECIFIC',label: 'Specific Users',icon: Users },
];

const BroadcastPage = () => {
  const [form, setForm] = useState({
    type:      'PLATFORM_BROADCAST',
    title:     '',
    message:   '',
    audience:  'ALL',
    userIds:   '',
  });

  const [sending,   setSending]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [users,     setUsers]     = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [alert,     setAlert]     = useState(null);
  const [sent,      setSent]      = useState(null);
  const [errors,    setErrors]    = useState({});

  // Load users if SPECIFIC audience selected
  const handleAudienceChange = async (audience) => {
    setForm(p => ({ ...p, audience }));
    if (audience !== 'SPECIFIC') return;

    setLoading(true);
    try {
      const res = await authApi.getAllUsers();
      setUsers(res.data || []);
    } catch {}
    setLoading(false);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())
      e.title   = 'Title is required';
    if (!form.message.trim())
      e.message = 'Message is required';
    if (form.audience === 'SPECIFIC') {
      const ids = parseUserIds();
      if (ids.length === 0)
        e.userIds = 'Enter at least one valid user ID';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const parseUserIds = () => {
    return form.userIds
      .split(/[\s,]+/)
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id) && id > 0);
  };

  const getRecipientIds = async () => {
    if (form.audience === 'SPECIFIC') {
      return parseUserIds();
    }

    const res = await authApi.getAllUsers();
    const all = res.data || [];

    if (form.audience === 'ALL') {
      return all.map(u => u.id);
    }
    return all
      .filter(u => u.role === form.audience)
      .map(u => u.id);
  };

  const handleSend = async () => {
    if (!validate()) return;
    setSending(true);
    setAlert(null);

    try {
      const recipientIds = await getRecipientIds();

      if (recipientIds.length === 0) {
        setAlert({
          type: 'warning',
          message: 'No recipients found for the selected audience.',
        });
        setSending(false);
        return;
      }

      const payload = {
        recipientIds,
        type:        form.type,
        title:       form.title.trim(),
        message:     form.message.trim(),
        channel:     'ALL',
        relatedType: 'BROADCAST',
      };

      const res = await notificationApi.broadcastNotification(payload);
      const sentCount = Array.isArray(res.data)
        ? res.data.length
        : recipientIds.length;

      setSent({
        count:    sentCount,
        audience: form.audience,
        title:    form.title,
      });

      setAlert({
        type: 'success',
        message: `Broadcast sent to ${sentCount} users successfully!`,
      });

      // Reset form
      setForm({
        type:    'PLATFORM_BROADCAST',
        title:   '',
        message: '',
        audience:'ALL',
        userIds: '',
      });
      setErrors({});

    } catch (err) {
      setAlert({
        type: 'error',
        message: `Broadcast failed. Please try again.`,
      });
    } finally {
      setSending(false);
    }
  };

  const audienceLabels = {
    ALL:      'All registered users',
    DRIVER:   'All drivers',
    MANAGER:  'All lot managers',
    SPECIFIC: 'Specific user IDs',
  };

  const toggleUserId = (id) => {
    const currentIds = parseUserIds();
    let newIds;
    if (currentIds.includes(id)) {
      newIds = currentIds.filter(i => i !== id);
    } else {
      newIds = [...currentIds, id];
    }
    setForm(p => ({ ...p, userIds: newIds.join(', ') }));
  };

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Broadcast Notification
        </h1>
        <p className="text-slate-500 mt-1">
          Send platform-wide announcements to users
        </p>
      </div>

      {alert && (
        <Alert
          variant={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* ── Last sent summary ─────────────────────────────────── */}
      {sent && (
        <div className="card bg-emerald-50 border border-emerald-100">
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600
                                     flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Broadcast sent successfully
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                "{sent.title}" sent to{' '}
                <strong>{sent.count} users</strong>
                {' '}({audienceLabels[sent.audience]})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Broadcast form ────────────────────────────────────── */}
      <div className="card">
        <div className="space-y-5">

          {/* Audience selection */}
          <div>
            <label className="block text-sm font-medium
                              text-slate-700 mb-2">
              Target Audience
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleAudienceChange(value)}
                  className={`
                    flex items-center gap-2 p-3 rounded-xl border-2
                    text-left text-sm font-medium transition-all
                    ${form.audience === value
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Estimated recipients */}
            <p className="text-xs text-slate-500 mt-2 flex
                          items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Target: {audienceLabels[form.audience]}
            </p>
          </div>

          {/* Specific user IDs input */}
          {form.audience === 'SPECIFIC' && (
            <div>
              {loading ? (
                <SectionLoader message="Loading users..." />
              ) : (
                <div className="space-y-3">
                  <Textarea
                    label="User IDs"
                    placeholder="Enter user IDs separated by commas or spaces: 1, 2, 3, 45"
                    value={form.userIds}
                    onChange={(e) => setForm(p => ({
                      ...p, userIds: e.target.value
                    }))}
                    error={errors.userIds}
                    rows={3}
                    hint={`${parseUserIds().length} user ID(s) entered`}
                  />

                  {/* User Search Helper */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      User Lookup Helper
                    </p>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search users by name or email..."
                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                          onChange={(e) => {
                            const q = e.target.value.toLowerCase();
                            if (!q) {
                              setFilteredUsers([]);
                              return;
                            }
                            const matches = users.filter(u => 
                              u.fullName?.toLowerCase().includes(q) || 
                              u.email?.toLowerCase().includes(q) ||
                              String(u.id).includes(q)
                            ).slice(0, 5);
                            setFilteredUsers(matches);
                          }}
                        />
                      </div>

                      {filteredUsers.length > 0 && (
                        <div className="space-y-1">
                          {filteredUsers.map(u => {
                            const isSelected = parseUserIds().includes(u.id);
                            return (
                              <div 
                                key={u.id} 
                                onClick={() => toggleUserId(u.id)}
                                className={`
                                  flex items-center justify-between p-2 rounded-lg border 
                                  cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]
                                  ${isSelected 
                                    ? 'bg-violet-50 border-violet-200 shadow-sm' 
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                  }
                                `}
                              >
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{u.fullName}</p>
                                  <p className="text-xs text-slate-500">{u.email}</p>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                  {isSelected && (
                                    <CheckCircle2 className="w-4 h-4 text-violet-600" />
                                  )}
                                  <p className={`
                                    text-xs font-mono font-bold px-2 py-1 rounded
                                    ${isSelected ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600'}
                                  `}>
                                    ID: {u.id}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {users.length > 0 && filteredUsers.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic">
                          Start typing to find user IDs (searches name, email, or ID)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notification type */}
          <Select
            label="Notification Type"
            value={form.type}
            onChange={(e) => setForm(p => ({
              ...p, type: e.target.value
            }))}
          >
            {NOTIFICATION_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>

          {/* Title */}
          <Input
            label="Notification Title"
            placeholder="e.g. System Maintenance Notice"
            value={form.title}
            onChange={(e) => setForm(p => ({
              ...p, title: e.target.value
            }))}
            error={errors.title}
            required
            hint={`${form.title.length}/100 characters`}
            maxLength={100}
          />

          {/* Message */}
          <Textarea
            label="Message"
            placeholder="Write your broadcast message here..."
            value={form.message}
            onChange={(e) => setForm(p => ({
              ...p, message: e.target.value
            }))}
            error={errors.message}
            rows={4}
            required
            hint={`${form.message.length}/1000 characters`}
          />

          {/* Preview card */}
          {(form.title || form.message) && (
            <div className="p-4 bg-slate-50 rounded-xl border
                            border-slate-200">
              <p className="text-xs font-semibold text-slate-500
                            uppercase tracking-wide mb-2">
                Preview
              </p>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-violet-100 rounded-full
                                flex items-center justify-center
                                flex-shrink-0">
                  <Bell className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {form.title || 'Notification Title'}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5
                                leading-relaxed">
                    {form.message || 'Your message will appear here.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex gap-2 p-3 bg-amber-50 rounded-xl
                          border border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-600
                                      flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              This will send in-app notifications to all selected
              users immediately. This action cannot be undone.
            </p>
          </div>

          {/* Send button */}
          <Button
            fullWidth
            size="lg"
            loading={sending}
            onClick={handleSend}
            icon={<Send className="w-5 h-5" />}
          >
            {sending ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </div>
      </div>

      {/* ── Broadcast history hint ────────────────────────────── */}
      <div className="card bg-slate-50">
        <h3 className="font-medium text-slate-700 text-sm mb-2
                       flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-400" />
          Broadcast Tips
        </h3>
        <ul className="space-y-1.5 text-xs text-slate-500">
          <li className="flex items-start gap-1.5">
            <span className="text-violet-400 font-bold flex-shrink-0">
              •
            </span>
            Use <strong>Platform Broadcast</strong> for system
            maintenance, new features, or policy changes.
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-violet-400 font-bold flex-shrink-0">
              •
            </span>
            Target <strong>All Managers</strong> for lot-related
            announcements.
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-violet-400 font-bold flex-shrink-0">
              •
            </span>
            Target <strong>All Drivers</strong> for promotional
            offers or parking tips.
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-violet-400 font-bold flex-shrink-0">
              •
            </span>
            Use <strong>Specific Users</strong> for targeted
            support or account-specific notices.
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-violet-400 font-bold flex-shrink-0">
              •
            </span>
            Notifications appear in each user's bell icon
            dropdown immediately.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BroadcastPage;