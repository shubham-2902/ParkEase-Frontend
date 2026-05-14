import axiosInstance from './axiosInstance';

const BASE = '/api/v1/analytics';

const analyticsApi = {

  // ── Occupancy rate for a lot ──────────────────────────────────
  getOccupancyRate: (lotId) =>
    axiosInstance.get(`${BASE}/occupancy/${lotId}`),

  // ── All lots occupancy (Admin) ────────────────────────────────
  getAllOccupancy: () =>
    axiosInstance.get(`${BASE}/occupancy`),

  // ── Peak hours for a lot ──────────────────────────────────────
  getPeakHours: (lotId) =>
    axiosInstance.get(`${BASE}/peak-hours/${lotId}`),

  // ── Hourly breakdown (24 hours) ───────────────────────────────
  getHourlyBreakdown: (lotId) =>
    axiosInstance.get(`${BASE}/hourly/${lotId}`),

  // ── Revenue report ────────────────────────────────────────────
  getRevenue: (lotId, from, to) =>
    axiosInstance.get(`${BASE}/revenue/${lotId}`, {
      params: from && to ? { from, to } : {},
    }),

  // ── Spot type utilisation ─────────────────────────────────────
  getSpotTypeUtilisation: (lotId) =>
    axiosInstance.get(`${BASE}/spot-types/${lotId}`),

  // ── Average parking duration ──────────────────────────────────
  getAvgDuration: (lotId) =>
    axiosInstance.get(`${BASE}/avg-duration/${lotId}`),

  // ── Daily report ──────────────────────────────────────────────
  getDailyReport: (lotId, date) =>
    axiosInstance.get(`${BASE}/daily-report/${lotId}`, {
      params: { date },
    }),

  // ── Platform summary (Admin) ──────────────────────────────────
  getPlatformSummary: () =>
    axiosInstance.get(`${BASE}/platform`),
};

export default analyticsApi;