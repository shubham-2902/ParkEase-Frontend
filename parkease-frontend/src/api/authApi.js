import { API_BASE_URL } from '../utils/constants';
import axiosInstance from './axiosInstance';

const BASE = '/api/v1/auth';

const authApi = {

  // ── Register ─────────────────────────────────────────────────
  register: (data) =>
    axiosInstance.post(`${BASE}/register`, data),

  // ── Login ─────────────────────────────────────────────────────
  login: (data) =>
    axiosInstance.post(`${BASE}/login`, data),

  // ── Refresh Token ─────────────────────────────────────────────
  refreshToken: (refreshToken) =>
    axiosInstance.post(`${BASE}/refresh`, { refreshToken }),

  // ── Get Profile ───────────────────────────────────────────────
  getProfile: () =>
    axiosInstance.get(`${BASE}/profile`),

  // ── Update Profile ────────────────────────────────────────────
  updateProfile: (data) =>
    axiosInstance.put(`${BASE}/profile`, data),

  // ── Change Password ───────────────────────────────────────────
  changePassword: (data) =>
    axiosInstance.put(`${BASE}/password`, data),

  // ── Deactivate Account ────────────────────────────────────────
  deactivateAccount: () =>
    axiosInstance.delete(`${BASE}/deactivate`),

  // ── Google OAuth2 Login ───────────────────────────────────────
  // Opens Google consent page — handled by Spring Security
  googleLogin: (role) => {
    const baseUrl = `${API_BASE_URL}/oauth2/authorization/google`;
    // Pass the current domain as a redirect target for the backend
    const redirectParam = `?redirect_uri=${window.location.origin}/login`;
    const roleParam = role ? `&role=${role}` : '';
    window.location.href = `${baseUrl}${redirectParam}${roleParam}`;
  },

  // ── Admin: Get all users ──────────────────────────────────────
  getAllUsers: () =>
    axiosInstance.get(`${BASE}/users/all`),

  // ── Admin: Suspend user ───────────────────────────────────────
  suspendUser: (userId) =>
    axiosInstance.put(`${BASE}/users/${userId}/suspend`),

  // ── Admin: Activate user ──────────────────────────────────────
  activateUser: (userId) =>
    axiosInstance.put(`${BASE}/users/${userId}/activate`),

  // ── Admin: Delete user ────────────────────────────────────────
  deleteUser: (userId) =>
    axiosInstance.delete(`${BASE}/users/${userId}`),
};

export default authApi;