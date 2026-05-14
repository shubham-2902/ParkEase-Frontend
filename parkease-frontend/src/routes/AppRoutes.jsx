
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { PageLoader } from '../components/ui/Spinner';
import { ROLES } from '../utils/constants';

// ── Layouts ────────────────────────────────────────────────────
import GuestLayout   from '../layouts/GuestLayout';
import DriverLayout  from '../layouts/DriverLayout';
import ManagerLayout from '../layouts/ManagerLayout';
import AdminLayout   from '../layouts/AdminLayout';

// ── Lazy-loaded pages ──────────────────────────────────────────

// Auth
const LoginPage    = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const OAuthCallbackPage = lazy(
  () => import('../pages/auth/OAuthCallbackPage')
);

// Guest
const HomePage          = lazy(() => import('../pages/guest/HomePage'));
const SearchResultsPage = lazy(() => import('../pages/guest/SearchResultsPage'));
const LotDetailPage     = lazy(() => import('../pages/guest/LotDetailPage'));

// Driver
const DriverDashboard  = lazy(() => import('../pages/driver/DriverDashboard'));
const MyVehiclesPage   = lazy(() => import('../pages/driver/MyVehiclesPage'));
const MyBookingsPage   = lazy(() => import('../pages/driver/MyBookingsPage'));
const BookingHistoryPage = lazy(() => import('../pages/driver/BookingHistoryPage'));
const MyPaymentsPage   = lazy(() => import('../pages/driver/MyPaymentsPage'));
const DriverProfile    = lazy(() => import('../pages/driver/DriverProfile'));
const CheckoutPage     = lazy(() => import('../pages/driver/CheckoutPage'));

// Manager
const ManagerDashboard = lazy(() => import('../pages/manager/ManagerDashboard'));
const LotManagement    = lazy(() => import('../pages/manager/LotManagement'));
const SpotEditor       = lazy(() => import('../pages/manager/SpotEditor'));
const ManagerBookings  = lazy(() => import('../pages/manager/ManagerBookings'));
const ManagerAnalytics = lazy(() => import('../pages/manager/ManagerAnalytics'));
const ManagerProfile   = lazy(() => import('../pages/manager/ManagerProfile'));

// Admin
const AdminDashboard   = lazy(() => import('../pages/admin/AdminDashboard'));
const LotApprovals     = lazy(() => import('../pages/admin/LotApprovals'));
const UserManagement   = lazy(() => import('../pages/admin/UserManagement'));
const AdminBookings    = lazy(() => import('../pages/admin/AdminBookings'));
const AdminPayments    = lazy(() => import('../pages/admin/AdminPayments'));
const AdminAnalytics   = lazy(() => import('../pages/admin/AdminAnalytics'));
const BroadcastPage    = lazy(() => import('../pages/admin/BroadcastPage'));

// ── Wrapper with Suspense ──────────────────────────────────────
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);

// ── AppRoutes ──────────────────────────────────────────────────
const AppRoutes = () => {
  return (
    <SuspenseWrapper>
      <Routes>

        {/* ── Guest / Public routes ─────────────────────────── */}
        <Route
          path="/"
          element={
            <GuestLayout>
              <HomePage />
            </GuestLayout>
          }
        />

        <Route
          path="/search"
          element={
            <GuestLayout>
              <SearchResultsPage />
            </GuestLayout>
          }
        />

        <Route
          path="/lots/:lotId"
          element={
            <GuestLayout>
              <LotDetailPage />
            </GuestLayout>
          }
        />

        {/* ── Auth routes ───────────────────────────────────── */}
        <Route path="/login"           element={<LoginPage />}    />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* OAuth2 callback — handled by AuthContext */}
        <Route
           path="/oauth2/callback"
           element={<OAuthCallbackPage />}
                    />

        {/* ── Driver routes ─────────────────────────────────── */}
        <Route
          path="/driver/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DRIVER]}>
              <DriverLayout>
                <Routes>
                  <Route
                    path="dashboard"
                    element={<DriverDashboard />}
                  />
                  <Route
                    path="vehicles"
                    element={<MyVehiclesPage />}
                  />
                  <Route
                    path="bookings"
                    element={<MyBookingsPage />}
                  />
                  <Route
                    path="history"
                    element={<BookingHistoryPage />}
                  />
                  <Route
                    path="payments"
                    element={<MyPaymentsPage />}
                  />
                  <Route
                    path="profile"
                    element={<DriverProfile />}
                  />
                  <Route
                    path="checkout/:bookingId"
                    element={<CheckoutPage />}
                  />
                  <Route
                    path=""
                    element={<Navigate to="dashboard" replace />}
                  />
                </Routes>
              </DriverLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Manager routes ────────────────────────────────── */}
        <Route
          path="/manager/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
              <ManagerLayout>
                <Routes>
                  <Route
                    path="dashboard"
                    element={<ManagerDashboard />}
                  />
                  <Route
                    path="lots"
                    element={<LotManagement />}
                  />
                  <Route
                    path="spots"
                    element={<SpotEditor />}
                  />
                  <Route
                    path="bookings"
                    element={<ManagerBookings />}
                  />
                  <Route
                    path="analytics"
                    element={<ManagerAnalytics />}
                  />
                  <Route
                    path="profile"
                    element={<ManagerProfile />}
                  />
                  <Route
                    path=""
                    element={<Navigate to="dashboard" replace />}
                  />
                </Routes>
              </ManagerLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Admin routes ──────────────────────────────────── */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout>
                <Routes>
                  <Route
                    path="dashboard"
                    element={<AdminDashboard />}
                  />
                  <Route
                    path="lots"
                    element={<LotApprovals />}
                  />
                  <Route
                    path="users"
                    element={<UserManagement />}
                  />
                  <Route
                    path="bookings"
                    element={<AdminBookings />}
                  />
                  <Route
                    path="payments"
                    element={<AdminPayments />}
                  />
                  <Route
                    path="analytics"
                    element={<AdminAnalytics />}
                  />
                  <Route
                    path="broadcast"
                    element={<BroadcastPage />}
                  />
                  <Route
                    path=""
                    element={<Navigate to="dashboard" replace />}
                  />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ── 404 Fallback ──────────────────────────────────── */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col
                            items-center justify-center
                            bg-slate-50 gap-4">
              <div className="text-6xl font-bold text-slate-200">
                404
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Page not found
              </h1>
              <p className="text-slate-500">
                The page you're looking for doesn't exist.
              </p>
              <a href="/" className="btn-primary mt-2">
                  Go home
              </a>
            </div>
          }
        />

      </Routes>
    </SuspenseWrapper>
  );
};

export default AppRoutes;