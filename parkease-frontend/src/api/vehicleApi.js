import axiosInstance from './axiosInstance';

const BASE = '/api/v1/vehicles';

const vehicleApi = {

  // ── Register vehicle ──────────────────────────────────────────
  registerVehicle: (data) =>
    axiosInstance.post(BASE, data),

  // ── Get vehicle by ID ─────────────────────────────────────────
  getVehicleById: (id) =>
    axiosInstance.get(`${BASE}/${id}`),

  // ── Get vehicle by plate ──────────────────────────────────────
  getVehicleByPlate: (plate) =>
    axiosInstance.get(`${BASE}/plate/${plate}`),

  // ── Get my vehicles (Driver) ──────────────────────────────────
  getMyVehicles: () =>
    axiosInstance.get(`${BASE}/my`),

  // ── Count my vehicles ─────────────────────────────────────────
  countMyVehicles: () =>
    axiosInstance.get(`${BASE}/my/count`),

  // ── Update vehicle ────────────────────────────────────────────
  updateVehicle: (id, data) =>
    axiosInstance.put(`${BASE}/${id}`, data),

  // ── Mark as EV ───────────────────────────────────────────────
  markAsEV: (id) =>
    axiosInstance.put(`${BASE}/${id}/ev`),

  // ── Delete (deactivate) vehicle ───────────────────────────────
  deleteVehicle: (id) =>
    axiosInstance.delete(`${BASE}/${id}`),

  // ── Admin: Get all vehicles ───────────────────────────────────
  getAllVehicles: () =>
    axiosInstance.get(`${BASE}/all`),

  // ── Admin: Get by type ────────────────────────────────────────
  getVehiclesByType: (vehicleType) =>
    axiosInstance.get(`${BASE}/type`, { params: { vehicleType } }),

  // ── Admin: Get all EV vehicles ────────────────────────────────
  getAllEVVehicles: () =>
    axiosInstance.get(`${BASE}/ev/all`),
};

export default vehicleApi;