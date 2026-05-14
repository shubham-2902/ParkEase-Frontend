import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  SquareParking, Mail, Lock, Eye, EyeOff,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import authApi from '../../api/authApi';

const LoginPage = () => {
  const { login, isLoggedIn, user, authError, setAuthError } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  // If already logged in → redirect to dashboard
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

  // Clear auth errors on unmount
  useEffect(() => {
    return () => setAuthError(null);
  }, [setAuthError]);

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
                        e.email    = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    await login(form.email, form.password);
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    authApi.googleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br
                    from-blue-50 via-white to-slate-50
                    flex">

      {/* ── Left panel (hero) — hidden on mobile ──────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600
                      flex-col justify-between p-12
                      relative overflow-hidden">

        {/* Background circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96
                        bg-blue-500 rounded-full opacity-30" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80
                        bg-blue-700 rounded-full opacity-30" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl
                          flex items-center justify-center">
            <SquareParking className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-2xl">
            ParkEase
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white
                         leading-tight mb-4">
            Find. Reserve.<br />Park. Effortlessly.
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            India's smartest parking platform. Book spots
            in advance, check in digitally, and pay online.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { value: '500+', label: 'Parking Lots' },
              { value: '50K+', label: 'Happy Drivers' },
              { value: '10+',  label: 'Cities'        },
            ].map(({ value, label }) => (
              <div key={label}
                   className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-white font-bold text-2xl">
                  {value}
                </p>
                <p className="text-blue-100 text-xs mt-1">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-200 text-sm">
          © {new Date().getFullYear()} ParkEase Platform
        </p>
      </div>

      {/* ── Right panel (form) ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center
                      p-6 sm:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg
                            flex items-center justify-center">
              <SquareParking className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-xl">
              Park<span className="text-blue-600">Ease</span>
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Welcome back
            </h2>
            <p className="text-slate-500 mt-1">
              Sign in to your ParkEase account
            </p>
          </div>

          {/* Auth error */}
          {authError && (
            <Alert
              variant="error"
              message={authError}
              onClose={() => setAuthError(null)}
              className="mb-6"
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

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
              placeholder="Enter your password"
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

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
              className="mt-2"
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">
              OR
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center
                       gap-3 px-4 py-2.5 rounded-lg border
                       border-slate-200 bg-white text-slate-700
                       text-sm font-medium hover:bg-slate-50
                       transition-colors"
          >
            {/* Google SVG icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Register link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Create one free
            </Link>
          </p>

          {/* Guest browsing */}
          <p className="text-center mt-3">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Browse parking without signing in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;