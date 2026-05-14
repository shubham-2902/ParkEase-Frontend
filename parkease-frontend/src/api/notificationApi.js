import axiosInstance from './axiosInstance';

const BASE = '/api/v1/notifications';

const notificationApi = {

  // ── Get my notifications ──────────────────────────────────────
  getMyNotifications: () =>
    axiosInstance.get(`${BASE}/my`),

  // ── Get unread notifications ──────────────────────────────────
  getUnreadNotifications: () =>
    axiosInstance.get(`${BASE}/my/unread`),

  // ── Get unread count (bell badge) ─────────────────────────────
  getUnreadCount: () =>
    axiosInstance.get(`${BASE}/my/unread/count`),

  // ── Mark single notification as read ─────────────────────────
  markAsRead: (id) =>
    axiosInstance.put(`${BASE}/my/${id}/read`),

  // ── Mark all as read ──────────────────────────────────────────
  markAllAsRead: () =>
    axiosInstance.put(`${BASE}/my/read-all`),

  // ── Delete notification ───────────────────────────────────────
  deleteNotification: (id) =>
    axiosInstance.delete(`${BASE}/${id}`),

  // ── Admin: Get all notifications ──────────────────────────────
  getAllNotifications: () =>
    axiosInstance.get(`${BASE}/all`),

  // ── Admin: Send manual notification ──────────────────────────
  sendNotification: (data) =>
    axiosInstance.post(`${BASE}/send`, data),

  // ── Admin: Bulk broadcast ─────────────────────────────────────
  broadcastNotification: (data) =>
    axiosInstance.post(`${BASE}/broadcast`, data),
};

export default notificationApi;