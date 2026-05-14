import axiosInstance from './axiosInstance';

const BASE = '/api/v1/payments';

const paymentApi = {

  // ── Step 1: Create Razorpay order ────────────────────────────
  // Returns razorpayOrderId + keyId for frontend modal
  createOrder: (data) =>
    axiosInstance.post(`${BASE}/create-order`, data),

  // ── Step 2: Verify payment signature ─────────────────────────
  // Called after Razorpay modal success
  verifyPayment: (data) =>
    axiosInstance.post(`${BASE}/verify`, data),


  // ── Get payment by ID ─────────────────────────────────────────
  getPaymentById: (id) =>
    axiosInstance.get(`${BASE}/${id}`),

  // ── Get payment by booking ID ─────────────────────────────────
  getPaymentByBookingId: (bookingId) =>
    axiosInstance.get(`${BASE}/booking/${bookingId}`),

  // ── Get my payment history ────────────────────────────────────
  getMyPayments: () =>
    axiosInstance.get(`${BASE}/my`),

  // ── Get payment status ────────────────────────────────────────
  getPaymentStatus: (id) =>
    axiosInstance.get(`${BASE}/${id}/status`),

  // ── Generate receipt ──────────────────────────────────────────
  generateReceipt: (id) =>
    axiosInstance.get(`${BASE}/${id}/receipt`),

  // ── Manager: Get lot revenue ──────────────────────────────────
  getLotRevenue: (lotId, from, to) =>
    axiosInstance.get(`${BASE}/revenue/lot/${lotId}`, {
      params: from && to ? { from, to } : {},
    }),

  // ── Manager: Get daily revenue breakdown ──────────────────────
  getDailyRevenue: (lotId, from, to) =>
    axiosInstance.get(`${BASE}/revenue/lot/${lotId}/daily`, {
      params: { from, to },
    }),

  // ── Admin: Get platform revenue ───────────────────────────────
  getPlatformRevenue: (from, to) =>
    axiosInstance.get(`${BASE}/revenue/platform`, {
      params: from && to ? { from, to } : {},
    }),

  // ── Admin: Get all payments ───────────────────────────────────
  getAllPayments: () =>
    axiosInstance.get(`${BASE}/all`),
};

export default paymentApi;