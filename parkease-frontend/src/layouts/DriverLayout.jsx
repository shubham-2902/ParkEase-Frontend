import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ParkingSquare, LayoutDashboard, Car, CalendarDays,
  History, CreditCard, Bell, User, LogOut,
  Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/shared/NotificationBell';
import UserAvatar from '../components/shared/UserAvatar';

const NAV_ITEMS = [
  { path: '/driver/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { path: '/driver/vehicles',   label: 'My Vehicles', icon: Car             },
  { path: '/driver/bookings',   label: 'Bookings',    icon: CalendarDays    },
  { path: '/driver/history',    label: 'History',     icon: History         },
  { path: '/driver/payments',   label: 'Payments',    icon: CreditCard      },
  { path: '/driver/profile',    label: 'Profile',     icon: User            },
];

const DriverLayout = ({ children }) => {
  const { user, logout }       = useAuth();
  const navigate               = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg
                          flex items-center justify-center">
            <ParkingSquare className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">
            Park<span className="text-blue-600">Ease</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 ml-10.5">
          Driver Portal
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }
            `}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1
                        rounded-lg bg-slate-50">
          <UserAvatar
            name={user?.fullName}
            imageUrl={user?.profilePicUrl}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.fullName || 'Driver'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2
                     text-sm text-slate-600 hover:text-red-600
                     hover:bg-red-50 rounded-lg transition-colors
                     font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60
                        bg-white border-r border-slate-100
                        flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ───────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white
                             flex-shrink-0 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-100
                            flex-shrink-0 h-14 px-4 sm:px-6
                            flex items-center justify-between">
          <button
            className="lg:hidden p-2 rounded-lg text-slate-500
                        hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="lg:hidden flex items-center gap-2">
            <ParkingSquare className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900 text-sm">
              ParkEase
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <NotificationBell />
            <UserAvatar
              name={user?.fullName}
              imageUrl={user?.profilePicUrl}
              size="sm"
            />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DriverLayout;