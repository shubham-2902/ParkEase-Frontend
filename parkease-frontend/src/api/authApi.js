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
    const baseUrl = 'http://localhost:8080/oauth2/authorization/google';
    window.location.href = role ? `${baseUrl}?role=${role}` : baseUrl;
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