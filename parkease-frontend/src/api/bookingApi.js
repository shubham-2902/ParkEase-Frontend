import axiosInstance from './axiosInstance';

const BASE = '/api/v1/bookings';

const bookingApi = {

  // ── Create booking ────────────────────────────────────────────
  createBooking: (data) =>
    axiosInstance.post(BASE, data),

  // ── Get booking by ID ─────────────────────────────────────────
  getBookingById: (id) =>
    axiosInstance.get(`${BASE}/${id}`),

  // ── Get my bookings ───────────────────────────────────────────
  getMyBookings: () =>
    axiosInstance.get(`${BASE}/my`),

  // ── Get my active bookings ────────────────────────────────────
  getMyActiveBookings: () =>
    axiosInstance.get(`${BASE}/my/active`),

  // ── Get booking history ───────────────────────────────────────
  getMyHistory: () =>
    axiosInstance.get(`${BASE}/my/history`),

  // ── Check in ─────────────────────────────────────────────────
  checkIn: (id) =>
    axiosInstance.put(`${BASE}/${id}/checkin`),

  // ── Check out ─────────────────────────────────────────────────
  checkOut: (id) =>
    axiosInstance.put(`${BASE}/${id}/checkout`),

  // ── Cancel booking ────────────────────────────────────────────
  cancelBooking: (id) =>
    axiosInstance.put(`${BASE}/${id}/cancel`),

  // ── Extend booking ────────────────────────────────────────────
  extendBooking: (id, newEndTime) =>
    axiosInstance.put(`${BASE}/${id}/extend`, { newEndTime }),

  // ── Calculate current fare ───────────────────────────────────
  calculateFare: (id) =>
    axiosInstance.get(`${BASE}/${id}/fare`),

  // ── Manager: Get bookings for a lot ───────────────────────────
  getBookingsByLot: (lotId) =>
    axiosInstance.get(`${BASE}/lot/${lotId}`),

  // ── Admin: Get bookings by status ─────────────────────────────
  getBookingsByStatus: (status) =>
    axiosInstance.get(`${BASE}/status`, { params: { status } }),
};

export default bookingApi;