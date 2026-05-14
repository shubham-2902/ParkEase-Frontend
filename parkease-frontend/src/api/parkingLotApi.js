import axiosInstance from './axiosInstance';
import { publicAxios } from './axiosInstance';

const BASE = '/api/v1/lots';

const parkingLotApi = {

  // ── PUBLIC (no auth required) ─────────────────────────────────

  // Get all approved lots
  getAllApprovedLots: () =>
    publicAxios.get(BASE),

  // Search lots by city
  getLotsByCity: (city) =>
    publicAxios.get(`${BASE}/city/${city}`),

  // Nearby lots using GPS
  getNearbyLots: (latitude, longitude, radiusKm = 10) =>
    publicAxios.get(`${BASE}/nearby`, {
      params: { latitude, longitude, radiusKm },
    }),

  // Search by keyword
  searchLots: (keyword) =>
    publicAxios.get(`${BASE}/search`, { params: { keyword } }),

  // Get lot by ID
  getLotById: (id) =>
    publicAxios.get(`${BASE}/${id}`),

  // ── MANAGER ───────────────────────────────────────────────────

  // Create lot
  createLot: (data) =>
    axiosInstance.post(BASE, data),

  // Get manager's own lots
  getMyLots: () =>
    axiosInstance.get(`${BASE}/manager`),

  // Update lot
  updateLot: (id, data) =>
    axiosInstance.put(`${BASE}/${id}`, data),

  // Toggle lot open/closed
  toggleLot: (id) =>
    axiosInstance.put(`${BASE}/${id}/toggle`),

  // Delete lot
  deleteLot: (id) =>
    axiosInstance.delete(`${BASE}/${id}`),

  // ── ADMIN ─────────────────────────────────────────────────────

  // Get all lots (any status)
  getAllLots: () =>
    axiosInstance.get(`${BASE}/admin/all`),

  // Get lots by status
  getLotsByStatus: (status) =>
    axiosInstance.get(`${BASE}/admin/status`, { params: { status } }),

  // Approve lot
  approveLot: (id, note) =>
    axiosInstance.put(`${BASE}/${id}/approve`, { note }),

  // Reject lot
  rejectLot: (id, reason) =>
    axiosInstance.put(`${BASE}/${id}/reject`, { reason }),

  // Suspend lot
  suspendLot: (id) =>
    axiosInstance.put(`${BASE}/${id}/suspend`),
};

export default parkingLotApi;