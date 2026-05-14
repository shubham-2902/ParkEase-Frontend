import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Lock, Save, Eye, EyeOff,
} from 'lucide-react';
import { useAuth }  from '../../context/AuthContext';
import authApi      from '../../api/authApi';
import Button       from '../../components/ui/Button';
import Input        from '../../components/ui/Input';
import Alert        from '../../components/ui/Alert';
import UserAvatar   from '../../components/shared/UserAvatar';
import { getErrorMessage } from '../../utils/helpers';

const ManagerProfile = () => {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    fullName: '', phone: '', profilePicUrl: '',
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [formErrors, setFormErrors]   = useState({});
  const [pwErrors,   setPwErrors]     = useState({});
  const [savingP,    setSavingP]      = useState(false);
  const [savingPw,   setSavingPw]     = useState(false);
  const [showCur,    setShowCur]      = useState(false);
  const [showNew,    setShowNew]      = useState(false);
  const [alert,      setAlert]        = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        fullName:      user.fullName      || '',
        phone:         user.phone         || '',
        profilePicUrl: user.profilePicUrl || '',
      });
    }
  }, [user]);

  const validateForm = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Name is required';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
      e.phone = 'Enter valid 10-digit mobile number';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePw = () => {
    const e = {};
    if (!pwForm.currentPassword)
      e.currentPassword = 'Required';
    if (!pwForm.newPassword)
      e.newPassword = 'Required';
    else if (pwForm.newPassword.length < 8)
      e.newPassword = 'Minimum 8 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    setPwErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSavingP(true);
    try {
      const res = await authApi.updateProfile(form);
      updateUser(res.data);
      setAlert({ type: 'success', message: 'Profile updated!' });
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSavingP(false);
    }
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (!validatePw()) return;
    setSavingPw(true);
    try {
      await authApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      setPwForm({
        currentPassword: '', newPassword: '', confirmPassword: ''
      });
      setAlert({ type: 'success', message: 'Password updated!' });
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          My Profile
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your manager account
        </p>
      </div>

      {alert && (
        <Alert
          variant={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Avatar */}
      <div className="card">
        <div className="flex items-center gap-5">
          <UserAvatar
            name={user?.fullName}
            imageUrl={user?.profilePicUrl}
            size="xl"
          />
          <div>
            <h2 className="font-semibold text-slate-900 text-lg">
              {user?.fullName}
            </h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span className="mt-1 inline-block px-2.5 py-0.5
                             bg-emerald-100 text-emerald-700
                             text-xs font-semibold rounded-full">
              MANAGER
            </span>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-5 flex
                       items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          Personal Information
        </h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={form.fullName}
            onChange={(e) => setForm(p => ({
              ...p, fullName: e.target.value
            }))}
            error={formErrors.fullName}
            leftIcon={<User className="w-4 h-4" />}
            required
          />
          <Input
            label="Email"
            value={user?.email || ''}
            disabled
            leftIcon={<Mail className="w-4 h-4" />}
            hint="Email cannot be changed"
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm(p => ({
              ...p, phone: e.target.value
            }))}
            error={formErrors.phone}
            leftIcon={<Phone className="w-4 h-4" />}
          />
          <Input
            label="Profile Picture URL"
            type="url"
            value={form.profilePicUrl}
            onChange={(e) => setForm(p => ({
              ...p, profilePicUrl: e.target.value
            }))}
          />
          <Button
            type="submit"
            loading={savingP}
            icon={<Save className="w-4 h-4" />}
            variant="success"
          >
            Save Profile
          </Button>
        </form>
      </div>

      {/* Password form */}
      {user?.provider !== 'google' && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-5 flex
                         items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            Change Password
          </h3>
          <form onSubmit={handleChangePw} className="space-y-4">
            <Input
              label="Current Password"
              type={showCur ? 'text' : 'password'}
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm(p => ({
                ...p, currentPassword: e.target.value
              }))}
              error={pwErrors.currentPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowCur(!showCur)}
                  className="text-slate-400"
                >
                  {showCur
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye    className="w-4 h-4" />
                  }
                </button>
              }
            />
            <Input
              label="New Password"
              type={showNew ? 'text' : 'password'}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm(p => ({
                ...p, newPassword: e.target.value
              }))}
              error={pwErrors.newPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="text-slate-400"
                >
                  {showNew
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye    className="w-4 h-4" />
                  }
                </button>
              }
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm(p => ({
                ...p, confirmPassword: e.target.value
              }))}
              error={pwErrors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
            />
            <Button
              type="submit"
              loading={savingPw}
              icon={<Save className="w-4 h-4" />}
              variant="success"
            >
              Update Password
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManagerProfile;