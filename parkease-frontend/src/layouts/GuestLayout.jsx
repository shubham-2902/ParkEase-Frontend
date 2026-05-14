import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ParkingSquare, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const GuestLayout = ({ children }) => {
  const { isLoggedIn, user, isDriver, isManager, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = () => {
    if (isDriver)  return '/driver/dashboard';
    if (isManager) return '/manager/dashboard';
    if (isAdmin)   return '/admin/dashboard';
    return '/';
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95
                          backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg
                              flex items-center justify-center">
                <ParkingSquare className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg">
                Park<span className="text-blue-600">Ease</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="/#how-it-works"
                className="text-sm text-slate-600 hover:text-slate-900
                           font-medium transition-colors"
                onClick={(e) => {
                  if (window.location.pathname === '/') {
                    e.preventDefault();
                    document.getElementById('how-it-works')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                How it works
              </a>

              {isLoggedIn ? (
                <Button
                  size="sm"
                  onClick={() => navigate(dashboardPath())}
                >
                  My Dashboard
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<LogIn className="w-4 h-4" />}
                    onClick={() => navigate('/login')}
                  >
                    Log in
                  </Button>
                  <Button
                    size="sm"
                    icon={<UserPlus className="w-4 h-4" />}
                    onClick={() => navigate('/register')}
                  >
                    Sign up
                  </Button>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-500
                          hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen
                ? <X className="w-5 h-5" />
                : <Menu className="w-5 h-5" />
              }
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100
                           px-4 py-3 space-y-2 bg-white">
            <a
              href="/#how-it-works"
              className="block text-sm text-slate-600 py-2
                         hover:text-slate-900"
              onClick={(e) => {
                setMobileOpen(false);
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('how-it-works')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              How it works
            </a>
            {isLoggedIn ? (
              <Button
                fullWidth
                size="sm"
                onClick={() => {
                  navigate(dashboardPath());
                  setMobileOpen(false);
                }}
              >
                My Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  fullWidth
                  size="sm"
                  onClick={() => {
                    navigate('/login');
                    setMobileOpen(false);
                  }}
                >
                  Log in
                </Button>
                <Button
                  fullWidth
                  size="sm"
                  onClick={() => {
                    navigate('/register');
                    setMobileOpen(false);
                  }}
                >
                  Sign up
                </Button>
              </>
            )}
          </div>
        )}
      </header>

      {/* ── Page content ──────────────────────────────────────── */}
      <main>{children}</main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                        py-8">
          <div className="flex flex-col md:flex-row items-center
                          justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded
                              flex items-center justify-center">
                <ParkingSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-700 text-sm">
                ParkEase
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              © {new Date().getFullYear()} ParkEase.
              Find. Reserve. Park. Effortlessly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GuestLayout;