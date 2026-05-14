import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SquareParking, Mail, Lock, User,
  Phone, Eye, EyeOff, ArrowRight,
  Car, Building2, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import authApi from '../../api/authApi';
import { ROLES } from '../../utils/constants';

const ROLE_OPTIONS = [
  {
    value: ROLES.DRIVER,
    label: 'Driver',
    desc:  'Find and book parking spots',
    icon:  Car,
    color: 'blue',
  },
  {
    value: ROLES.MANAGER,
    label: 'Lot Manager',
    desc:  'Register and manage parking lots',
    icon:  Building2,
    color: 'emerald',
  },
];

const RegisterPage = () => {
  const { register, isLoggedIn, user, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]         = useState(1); // 1=role, 2=details
  const [selectedRole, setSelectedRole] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const [form, setForm] = useState({
    fullName: '',
    email:    '',
    password: '',
    phone:    '',
    role:     '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && user?.role) {
      const map = {
        DRIVER:  '/driver/dashboard',
        MANAGER: '/manager/dashboard',
        ADMIN:   '/admin/dashboard',
      };
      navigate(map[user.role] || '/', { replace: true });
    }
  }, [isLoggedIn, user, navigate]);

  useEffect(() => {
    return () => setAuthError(null);
  }, [setAuthError]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setForm(p => ({ ...p, role }));
    setStep(2);
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())
      e.fullName = 'Full name is required';
    else if (form.fullName.trim().length < 2)
      e.fullName = 'Name must be at least 2 characters';

    if (!form.email)
      e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Enter a valid email address';

    if (!form.password)
      e.password = 'Password is required';
    else if (form.password.length < 8)
      e.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      e.password = 'Must include uppercase, lowercase and a number';

    if (!form.phone)
      e.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone))
      e.phone = 'Enter a valid 10-digit Indian mobile number';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    await register(form);
    setLoading(false);
  };

  const colorMap = {
    blue:    { ring: 'ring-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-600',    icon: 'text-blue-600'    },
    emerald: { ring: 'ring-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-600' },
    violet:  { ring: 'ring-violet-500',  bg: 'bg-violet-50',  text: 'text-violet-600',  icon: 'text-violet-600'  },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br
                    from-slate-50 via-white to-blue-50
                    flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl
                            flex items-center justify-center">
              <SquareParking className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-xl">
              Park<span className="text-blue-600">Ease</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">
            Create your account
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Join thousands using ParkEase every day
          </p>
        </div>

        {/* ── STEP 1: Role selection ──────────────────────── */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              I want to join as a...
            </h2>

            <div className="space-y-3">
              {ROLE_OPTIONS.map(({
                value, label, desc, icon: Icon, color
              }) => {
                const c = colorMap[color];
                return (
                  <button
                    key={value}
                    onClick={() => handleRoleSelect(value)}
                    className={`
                      w-full flex items-center gap-4 p-4
                      rounded-xl border-2 text-left
                      transition-all duration-150
                      hover:border-slate-300 hover:bg-slate-50
                      ${selectedRole === value
                        ? `border-current ${c.ring} ${c.bg}`
                        : 'border-slate-200 bg-white'
                      }
                    `}
                  >
                    <div className={`
                      w-11 h-11 rounded-xl flex items-center
                      justify-center flex-shrink-0
                      ${c.bg}
                    `}>
                      <Icon className={`w-6 h-6 ${c.icon}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {desc}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400
                                           ml-auto flex-shrink-0" />
                  </button>
                );
              })}
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: Details form ────────────────────────── */}
        {step === 2 && (
          <div className="card">

            {/* Back + role indicator */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-slate-600
                           transition-colors text-sm"
              >
                ← Back
              </button>
              <div className="flex items-center gap-2 ml-auto">
                {(() => {
                  const roleOption = ROLE_OPTIONS
                    .find(r => r.value === selectedRole);
                  if (!roleOption) return null;
                  const { icon: Icon, label, color } = roleOption;
                  const c = colorMap[color];
                  return (
                    <span className={`
                      flex items-center gap-1.5 px-3 py-1
                      rounded-full text-xs font-medium
                      ${c.bg} ${c.text}
                    `}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Google OAuth (After Role Selection) */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => authApi.googleLogin(selectedRole)}
                className="w-full flex items-center justify-center
                           gap-3 px-4 py-3 rounded-xl border
                           border-slate-200 bg-white text-slate-700
                           text-sm font-medium hover:bg-slate-50
                           transition-all active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                  or fill details
                </span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
            </div>

            {/* Auth error */}
            {authError && (
              <Alert
                variant="error"
                message={authError}
                onClose={() => setAuthError(null)}
                className="mb-5"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <Input
                label="Full name"
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => setForm(p => ({
                  ...p, fullName: e.target.value
                }))}
                error={errors.fullName}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm(p => ({
                  ...p, email: e.target.value
                }))}
                error={errors.email}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="Min 8 chars, upper + lower + number"
                value={form.password}
                onChange={(e) => setForm(p => ({
                  ...p, password: e.target.value
                }))}
                error={errors.password}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPass
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                }
                required
              />

              {/* Password strength indicator */}
              {form.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[
                      form.password.length >= 8,
                      /[A-Z]/.test(form.password),
                      /[a-z]/.test(form.password),
                      /\d/.test(form.password),
                    ].map((met, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full
                          transition-colors ${
                          met ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Use 8+ chars with uppercase, lowercase & number
                  </p>
                </div>
              )}

              <Input
                label="Phone number *"
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => setForm(p => ({
                  ...p, phone: e.target.value
                }))}
                error={errors.phone}
                leftIcon={<Phone className="w-4 h-4" />}
                hint="Indian mobile number (10 digits)"
                required
              />

              <Button
                type="submit"
                fullWidth
                loading={loading}
                icon={<ArrowRight className="w-4 h-4" />}
                className="mt-2"
              >
                Create account
              </Button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-4">
              By creating an account you agree to our{' '}
              <span className="text-slate-600 cursor-pointer">
                Terms of Service
              </span>
            </p>
          </div>
        )}

        {/* Sign in link */}
        {step === 2 && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;