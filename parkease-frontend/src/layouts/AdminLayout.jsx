import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ParkingSquare, LayoutDashboard, Building2,
  Users, BookOpen, CreditCard, Bell,
  BarChart3, LogOut, Menu, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/shared/NotificationBell';
import UserAvatar from '../components/shared/UserAvatar';

const NAV_ITEMS = [
  { path: '/admin/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { path: '/admin/lots',       label: 'Lot Approvals', icon: Building2       },
  { path: '/admin/users',      label: 'Users',         icon: Users           },
  { path: '/admin/bookings',   label: 'All Bookings',  icon: BookOpen        },
  { path: '/admin/payments',   label: 'Payments',      icon: CreditCard      },
  { path: '/admin/analytics',  label: 'Analytics',     icon: BarChart3       },
  { path: '/admin/broadcast',  label: 'Broadcast',     icon: Bell            },
];

const AdminLayout = ({ children }) => {
  const { user, logout }      = useAuth();
  const navigate              = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg
                          flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">
            Park<span className="text-violet-600">Ease</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Admin Portal
        </p>
      </div>

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
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }
            `}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1
                        rounded-lg bg-violet-50">
          <UserAvatar
            name={user?.fullName}
            imageUrl={user?.profilePicUrl}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.fullName || 'Admin'}
            </p>
            <p className="text-xs text-violet-600 font-medium">
              Administrator
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2
                     text-sm text-slate-600 hover:text-red-600
                     hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      <aside className="hidden lg:flex flex-col w-60
                        bg-white border-r border-slate-100
                        flex-shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-100
                            h-14 px-4 sm:px-6
                            flex items-center justify-between">
          <button
            className="lg:hidden p-2 rounded-lg text-slate-500
                        hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="lg:hidden font-bold text-slate-900 text-sm">
            ParkEase — Admin
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <NotificationBell />
            <UserAvatar
              name={user?.fullName}
              imageUrl={user?.profilePicUrl}
              size="sm"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;