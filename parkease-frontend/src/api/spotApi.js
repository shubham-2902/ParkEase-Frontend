import axiosInstance from './axiosInstance';
import { publicAxios } from './axiosInstance';

const BASE = '/api/v1/spots';

const spotApi = {

  // ── PUBLIC ────────────────────────────────────────────────────

  // Get all spots in a lot
  getSpotsByLot: (lotId) =>
    publicAxios.get(`${BASE}/lot/${lotId}`),

  // Get available spots in a lot
  getAvailableSpots: (lotId) =>
    publicAxios.get(`${BASE}/lot/${lotId}/available`),

  // Get spots by type
  getSpotsByType: (lotId, spotType) =>
    publicAxios.get(`${BASE}/lot/${lotId}/type`, {
      params: { spotType },
    }),

  // Get spots by vehicle type
  getSpotsByVehicleType: (lotId, vehicleType) =>
    publicAxios.get(`${BASE}/lot/${lotId}/vehicle`, {
      params: { vehicleType },
    }),

  // Get EV spots
  getEVSpots: (lotId) =>
    publicAxios.get(`${BASE}/lot/${lotId}/ev`),

  // Get handicapped spots
  getHandicappedSpots: (lotId) =>
    publicAxios.get(`${BASE}/lot/${lotId}/handicapped`),

  // Get spots by floor
  getSpotsByFloor: (lotId, floor) =>
    publicAxios.get(`${BASE}/lot/${lotId}/floor`, {
      params: { floor },
    }),

  // Filter spots
  filterSpots: (lotId, filters) =>
    publicAxios.get(`${BASE}/lot/${lotId}/filter`, {
      params: filters,
    }),

  // Count available vs total
  countSpots: (lotId) =>
    publicAxios.get(`${BASE}/lot/${lotId}/count`),

  // Get spot by ID
  getSpotById: (id) =>
    publicAxios.get(`${BASE}/${id}`),

  // ── MANAGER ───────────────────────────────────────────────────

  // Create single spot
  createSpot: (data) =>
    axiosInstance.post(BASE, data),

  // Bulk create spots
  createBulkSpots: (data) =>
    axiosInstance.post(`${BASE}/bulk`, data),

  // Update spot
  updateSpot: (id, data) =>
    axiosInstance.put(`${BASE}/${id}`, data),

  // Delete spot
  deleteSpot: (id) =>
    axiosInstance.delete(`${BASE}/${id}`),

  // Set maintenance mode
  setMaintenance: (id) =>
    axiosInstance.put(`${BASE}/${id}/maintenance`),

  // Release spot (ends maintenance)
  releaseSpot: (id) =>
    axiosInstance.put(`${BASE}/${id}/release`),
};

export default spotApi;