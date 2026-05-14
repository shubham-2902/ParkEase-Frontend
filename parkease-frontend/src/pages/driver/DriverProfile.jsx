import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Lock, Camera,
  Save, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../api/authApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import UserAvatar from '../../components/shared/UserAvatar';
import { getErrorMessage } from '../../utils/helpers';

const DriverProfile = () => {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    profilePicUrl: '',

  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [alert, setAlert] = useState(null);

  // Pre-fill from auth context
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        profilePicUrl: user.profilePicUrl || '',

      });
    }
  }, [user]);

  // ── Validate profile ──────────────────────────────────────────
  const validateProfile = () => {
    const e = {};
    if (!profileForm.fullName.trim())
      e.fullName = 'Name is required';
    else if (profileForm.fullName.trim().length < 2)
      e.fullName = 'Name too short';
    if (profileForm.phone &&
      !/^[6-9]\d{9}$/.test(profileForm.phone))
      e.phone = 'Enter valid 10-digit mobile number';
    setProfileErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Validate password ─────────────────────────────────────────
  const validatePassword = () => {
    const e = {};
    if (!passwordForm.currentPassword)
      e.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword)
      e.newPassword = 'New password is required';
    else if (passwordForm.newPassword.length < 8)
      e.newPassword = 'Minimum 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(
      passwordForm.newPassword
    ))
      e.newPassword = 'Must include upper, lower and number';
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    setPasswordErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save profile ──────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone || undefined,
        profilePicUrl: profileForm.profilePicUrl || undefined,

      });
      updateUser(res.data);
      setAlert({ type: 'success', message: 'Profile updated!' });
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change password ───────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setAlert({ type: 'success', message: 'Password changed!' });
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          My Profile
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your account details
        </p>
      </div>

      {alert && (
        <Alert
          variant={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* ── Avatar section ────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-5">
          <div className="relative">
            <UserAvatar
              name={user?.fullName}
              imageUrl={user?.profilePicUrl}
              size="xl"
            />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-lg">
              {user?.fullName}
            </h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 bg-blue-100
                               text-blue-700 text-xs font-semibold
                               rounded-full">
                DRIVER
              </span>
              {user?.provider === 'google' && (
                <span className="px-2.5 py-0.5 bg-slate-100
                                 text-slate-600 text-xs font-medium
                                 rounded-full">
                  Google Account
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile form ──────────────────────────────────────── */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-5 flex
                       items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          Personal Information
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={profileForm.fullName}
            onChange={(e) => setProfileForm(p => ({
              ...p, fullName: e.target.value
            }))}
            error={profileErrors.fullName}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Email Address"
            value={user?.email || ''}
            disabled
            leftIcon={<Mail className="w-4 h-4" />}
            hint="Email cannot be changed"
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="9876543210"
            value={profileForm.phone}
            onChange={(e) => setProfileForm(p => ({
              ...p, phone: e.target.value
            }))}
            error={profileErrors.phone}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            label="Profile Picture URL"
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={profileForm.profilePicUrl}
            onChange={(e) => setProfileForm(p => ({
              ...p, profilePicUrl: e.target.value
            }))}
            leftIcon={<Camera className="w-4 h-4" />}
          />


          <Button
            type="submit"
            loading={savingProfile}
            icon={<Save className="w-4 h-4" />}
          >
            Save Profile
          </Button>
        </form>
      </div>

      {/* ── Password form (only for local accounts) ───────────── */}
      {user?.provider !== 'google' && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-5 flex
                         items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            Change Password
          </h3>

          <form
            onSubmit={handleChangePassword}
            className="space-y-4"
          >
            <Input
              label="Current Password"
              type={showCurrent ? 'text' : 'password'}
              placeholder="Your current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(p => ({
                ...p, currentPassword: e.target.value
              }))}
              error={passwordErrors.currentPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showCurrent
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              }
              required
            />

            <Input
              label="New Password"
              type={showNew ? 'text' : 'password'}
              placeholder="Min 8 chars with upper, lower and number"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(p => ({
                ...p, newPassword: e.target.value
              }))}
              error={passwordErrors.newPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showNew
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              }
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Repeat new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(p => ({
                ...p, confirmPassword: e.target.value
              }))}
              error={passwordErrors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              loading={savingPassword}
              icon={<Save className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </form>
        </div>
      )}

      {/* ── Account info ──────────────────────────────────────── */}
      <div className="card bg-slate-50">
        <h3 className="font-medium text-slate-700 text-sm mb-3">
          Account Information
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Member since</span>
            <span className="text-slate-700 font-medium">
              {user?.createdAt
                ? new Date(user.createdAt)
                  .toLocaleDateString('en-IN')
                : '—'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Login method</span>
            <span className="text-slate-700 font-medium capitalize">
              {user?.provider || 'Email'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Account status</span>
            <span className={`font-medium ${user?.isActive
                ? 'text-emerald-600'
                : 'text-red-600'
              }`}>
              {user?.isActive ? 'Active' : 'Deactivated'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;